import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KuCoinOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  size: string;
  stopPrice?: string;
}

// KuCoin API signing function
async function signRequest(timestamp: string, method: string, endpoint: string, body: string, secret: string) {
  const message = timestamp + method + endpoint + body;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKey = Deno.env.get('KUCOIN_API_KEY');
    const secretKey = Deno.env.get('KUCOIN_API_SECRET');
    const passphrase = Deno.env.get('KUCOIN_API_PASSPHRASE');

    if (!apiKey || !secretKey || !passphrase) {
      return new Response(JSON.stringify({
        success: false,
        errorMessage: 'KuCoin API keys not configured'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, orderData, symbol, interval } = await req.json() as { 
      action: 'place_order' | 'get_account' | 'get_market_data' | 'get_kline_data'; 
      orderData?: KuCoinOrderRequest;
      symbol?: string;
      interval?: string;
    };

    const timestamp = Date.now().toString();
    const baseUrl = 'https://api.kucoin.com';

    // === GET ACCOUNT INFO ===
    if (action === 'get_account') {
      const endpoint = '/api/v1/accounts';
      const signature = await signRequest(timestamp, 'GET', endpoint, '', secretKey);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'KC-API-KEY': apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': passphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });

      const accountData = await response.json();
      return new Response(JSON.stringify(accountData), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === GET MARKET DATA ===
    if (action === 'get_market_data') {
      try {
        const symbolsEndpoint = '/api/v1/symbols';
        const tickerEndpoint = '/api/v1/market/allTickers';
        
        const symbolsResponse = await fetch(`${baseUrl}${symbolsEndpoint}`);
        const symbolsData = await symbolsResponse.json();
        
        const tickerResponse = await fetch(`${baseUrl}${tickerEndpoint}`);
        const tickerData = await tickerResponse.json();
        
        const usdtSymbols = symbolsData.data?.filter((s: any) => 
          s.quoteCurrency === 'USDT' && 
          s.enableTrading
        )?.slice(0, 8)?.map((s: any) => s.symbol) || [];

        const prices: { [key: string]: number } = {};
        tickerData.data?.ticker?.forEach((ticker: any) => {
          if (usdtSymbols.includes(ticker.symbol)) {
            prices[ticker.symbol] = parseFloat(ticker.last);
          }
        });
        
        return new Response(JSON.stringify({
          success: true,
          symbols: usdtSymbols,
          prices: prices
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          errorMessage: 'Failed to fetch market data'
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // === GET KLINE DATA ===
    if (action === 'get_kline_data' && symbol && interval) {
      const klineUrl = `${baseUrl}/api/v1/market/candles?symbol=${symbol}&type=${interval}&startAt=${Math.floor(Date.now() / 1000) - 86400}&endAt=${Math.floor(Date.now() / 1000)}`;
      const response = await fetch(klineUrl);
      const data = await response.json();

      return new Response(JSON.stringify({
        success: data.code === '200000',
        klineData: data.data || [],
        errorMessage: data.code === '200000' ? undefined : 'Failed to fetch KuCoin K-line data'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // === PLACE ORDER ===
    if (action === 'place_order' && orderData) {
      try {
        // Hämta minsta orderstorlek för symbol
        const symbolsResponse = await fetch(`${baseUrl}/api/v1/symbols`);
        const symbolsData = await symbolsResponse.json();
        const symbolInfo = symbolsData.data?.find((s: any) => s.symbol === orderData.symbol);

        if (!symbolInfo) {
          return new Response(JSON.stringify({
            success: false,
            errorMessage: `Symbolinfo för ${orderData.symbol} hittades inte`
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const minSize = parseFloat(symbolInfo.baseMinSize);
        let finalSize = parseFloat(orderData.size);
        if (finalSize < minSize) {
          finalSize = minSize;
        }

        const endpoint = '/api/v1/orders';
        const body = JSON.stringify({
          clientOid: `lovable_${Date.now()}`,
          symbol: orderData.symbol,
          side: orderData.side,
          type: orderData.type,
          size: finalSize.toString(),
          ...(orderData.stopPrice && { stop: 'loss', stopPrice: orderData.stopPrice })
        });

        const signature = await signRequest(timestamp, 'POST', endpoint, body, secretKey);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'KC-API-KEY': apiKey,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': passphrase,
            'KC-API-KEY-VERSION': '2',
            'Content-Type': 'application/json'
          },
          body: body
        });

        const orderResult = await response.json();

        if (orderResult.code !== '200000') {
          return new Response(JSON.stringify({
            success: false,
            errorMessage: orderResult.msg || 'KuCoin avvisade ordern'
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        await supabaseClient.from('trading_orders').insert({
          order_id: orderResult.data.orderId,
          symbol: orderData.symbol,
          side: orderData.side,
          type: orderData.type,
          size: finalSize.toString(),
          status: 'placed',
          created_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({
          success: true,
          orderId: orderResult.data.orderId
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          errorMessage: error.message || 'Okänt fel vid order'
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({
      success: false,
      errorMessage: 'Invalid action'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      errorMessage: error.message || 'Server error'
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
