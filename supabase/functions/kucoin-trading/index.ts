import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KuCoinOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  size: string;
  stopPrice?: string;
}

// KuCoin API signing function
async function signRequest(timestamp: string, method: string, endpoint: string, body: string, secret: string) {
  const message = timestamp + method.toUpperCase() + endpoint + body;
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

async function kucoinFetch(path: string, method = "GET", bodyObj: any = null, apiKey: string, secretKey: string, passphrase: string) {
  const timestamp = Date.now().toString();
  const body = bodyObj ? JSON.stringify(bodyObj) : "";
  const signature = await signRequest(timestamp, method, path, body, secretKey);

  const res = await fetch(`https://api.kucoin.com${path}`, {
    method,
    headers: {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': passphrase,
      'KC-API-KEY-VERSION': '2',
      'Content-Type': 'application/json'
    },
    body: body || undefined,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, ok: res.ok, body: json };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const apiKey = Deno.env.get('KUCOIN_API_KEY');
    const secretKey = Deno.env.get('KUCOIN_API_SECRET');
    const passphrase = Deno.env.get('KUCOIN_API_PASSPHRASE');

    if (!apiKey || !secretKey || !passphrase) {
      return new Response(JSON.stringify({ error: 'KuCoin API keys not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { action, orderData, symbol, interval } = await req.json() as { 
      action: 'place_order' | 'get_account' | 'get_market_data' | 'get_kline_data'; 
      orderData?: KuCoinOrderRequest;
      symbol?: string;
      interval?: string;
    };

    const baseUrl = 'https://api.kucoin.com';

    if (action === 'get_account') {
      const accountRes = await kucoinFetch('/api/v1/accounts', 'GET', null, apiKey, secretKey, passphrase);
      return new Response(JSON.stringify(accountRes.body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_market_data') {
      const symbolsRes = await fetch(`${baseUrl}/api/v1/symbols`);
      const tickerRes = await fetch(`${baseUrl}/api/v1/market/allTickers`);
      const symbolsData = await symbolsRes.json();
      const tickerData = await tickerRes.json();
      const usdtSymbols = symbolsData.data?.filter((s: any) => 
        s.quoteCurrency === 'USDT' && s.isMarginEnabled && s.enableTrading &&
        parseFloat(s.baseMinSize) * parseFloat(tickerData.data?.ticker?.find((t: any) => t.symbol === s.symbol)?.last || '0') >= 1
      )?.slice(0, 8)?.map((s: any) => s.symbol) || [];
      const prices: { [key: string]: number } = {};
      tickerData.data?.ticker?.forEach((t: any) => {
        if (usdtSymbols.includes(t.symbol)) prices[t.symbol] = parseFloat(t.last);
      });
      return new Response(JSON.stringify({ symbols: usdtSymbols, prices, code: '200000' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'get_kline_data' && symbol && interval) {
      const klineUrl = `${baseUrl}/api/v1/market/candles?symbol=${symbol}&type=${interval}&startAt=${Math.floor(Date.now() / 1000) - 86400}&endAt=${Math.floor(Date.now() / 1000)}`;
      const res = await fetch(klineUrl);
      const data = await res.json();
      return new Response(JSON.stringify({ klineData: data.data || [], code: data.code }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'place_order' && orderData) {
      // Hämta marknadsinfo
      const marketRes = await kucoinFetch('/api/v1/symbols', 'GET', null, apiKey, secretKey, passphrase);
      const market = marketRes.body.data.find((m: any) => m.symbol === orderData.symbol);
      if (!market) {
        return new Response(JSON.stringify({ error: `Symbol ${orderData.symbol} not found` }), { headers: corsHeaders });
      }

      const minSize = parseFloat(market.baseMinSize);
      const minFunds = parseFloat(market.minFunds);

      // Hämta saldo
      const balanceRes = await kucoinFetch('/api/v1/accounts', 'GET', null, apiKey, secretKey, passphrase);
      const quoteCurrency = orderData.symbol.split('-')[1];
      const balance = parseFloat((balanceRes.body.data.find((b: any) => b.currency === quoteCurrency && b.type === "trade")?.available) || "0");

      // Justera size om den är för liten
      let adjustedSize = parseFloat(orderData.size);
      if (adjustedSize < minSize) adjustedSize = minSize;

      // Kolla saldo
      const estimatedCost = adjustedSize * parseFloat(market.price || "1");
      if (estimatedCost > balance || estimatedCost < minFunds) {
        return new Response(JSON.stringify({ error: `Insufficient balance or below minimum funds (${minFunds} ${quoteCurrency}). Available: ${balance}` }), { headers: corsHeaders });
      }

      // Skicka order
      const body = {
        clientOid: `lovable_${Date.now()}`,
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        size: adjustedSize.toString(),
        ...(orderData.stopPrice && { stop: 'loss', stopPrice: orderData.stopPrice })
      };
      const orderRes = await kucoinFetch('/api/v1/orders', 'POST', body, apiKey, secretKey, passphrase);

      // Spara order i DB
      if (orderRes.body.code === '200000') {
        await supabaseClient.from('trading_orders').insert({
          order_id: orderRes.body.data.orderId,
          symbol: orderData.symbol,
          side: orderData.side,
          type: orderData.type,
          size: adjustedSize,
          status: 'placed',
          created_at: new Date().toISOString()
        });
      }

      return new Response(JSON.stringify(orderRes.body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
