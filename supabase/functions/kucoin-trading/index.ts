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
  leverage?: string;
}

// KuCoin signering
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

// Hash KuCoin passphrase for v2 (HMAC-SHA256 base64)
async function hashPassphrase(passphrase: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(passphrase));
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
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
    const baseUrl = 'https://api.kucoin.com';

    if (!apiKey || !secretKey || !passphrase) {
      return new Response(
        JSON.stringify({ error: 'KuCoin API keys not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, orderData, symbol, interval, tradingType } = await req.json() as {
      action: 'place_order' | 'get_account' | 'get_market_data' | 'get_kline_data';
      orderData?: KuCoinOrderRequest;
      symbol?: string;
      interval?: string;
      tradingType?: 'spot' | 'futures';
    };

    const timestamp = Date.now().toString();

    // Hämta konto-info
    if (action === 'get_account') {
      const endpoint = '/api/v1/accounts';
      const signature = await signRequest(timestamp, 'GET', endpoint, '', secretKey);
      const hashedPassphrase = await hashPassphrase(passphrase, secretKey);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'KC-API-KEY': apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': hashedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });

      return new Response(await response.text(), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Hämta marknadsdata
    if (action === 'get_market_data') {
      const symbolsEndpoint = '/api/v1/symbols';
      const tickerEndpoint = '/api/v1/market/allTickers';

      const [symbolsRes, tickerRes] = await Promise.all([
        fetch(`${baseUrl}${symbolsEndpoint}`),
        fetch(`${baseUrl}${tickerEndpoint}`)
      ]);

      const symbolsData = await symbolsRes.json();
      const tickerData = await tickerRes.json();

      return new Response(
        JSON.stringify({ symbols: symbolsData.data, prices: tickerData.data?.ticker || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hämta K-line
    if (action === 'get_kline_data' && symbol && interval) {
      const klineUrl = `${baseUrl}/api/v1/market/candles?symbol=${symbol}&type=${interval}&startAt=${Math.floor(Date.now() / 1000) - 86400}&endAt=${Math.floor(Date.now() / 1000)}`;
      const response = await fetch(klineUrl);
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Placera order
    if (action === 'place_order' && orderData) {
      // Hämta min orderstorlek från symbolinfo
      const symbolInfoRes = await fetch(`${baseUrl}/api/v1/symbols`);
      const symbolInfoData = await symbolInfoRes.json();
      const symbolInfo = symbolInfoData.data.find((s: any) => s.symbol === orderData.symbol);

      let finalSize = parseFloat(orderData.size);
      if (symbolInfo && parseFloat(symbolInfo.baseMinSize) > finalSize) {
        finalSize = parseFloat(symbolInfo.baseMinSize);
      }

      const endpoint = '/api/v1/orders';
      const body = JSON.stringify({
        clientOid: `order_${Date.now()}`,
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        size: finalSize.toString(),
        leverage: orderData.leverage || '1',
        ...(orderData.stopPrice && { stop: 'loss', stopPrice: orderData.stopPrice })
      });

      const signature = await signRequest(timestamp, 'POST', endpoint, body, secretKey);
      const hashedPassphrase = await hashPassphrase(passphrase, secretKey);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'KC-API-KEY': apiKey,
          'KC-API-SIGN': signature,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': hashedPassphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        },
        body
      });

      const orderResult = await response.json();
      console.log('KuCoin order response:', orderResult);

      return new Response(JSON.stringify(orderResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
