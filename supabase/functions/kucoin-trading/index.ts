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

    const futuresKey = Deno.env.get('KUCOIN_FUTURES_API_KEY');
    const futuresSecret = Deno.env.get('KUCOIN_FUTURES_API_SECRET');
    const futuresPassphrase = Deno.env.get('KUCOIN_FUTURES_API_PASSPHRASE');

    if (!apiKey || !secretKey || !passphrase) {
      return new Response(JSON.stringify({ error: 'KuCoin Spot API keys not configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, orderData, symbol, interval } = await req.json();

    const timestamp = Date.now().toString();
    const baseUrl = 'https://api.kucoin.com';
    const futuresBase = 'https://api-futures.kucoin.com';

    if (action === 'get_account') {
      // --- SPOT ---
      const spotEndpoint = '/api/v1/accounts';
      const spotSig = await signRequest(timestamp, 'GET', spotEndpoint, '', secretKey);
      const spotRes = await fetch(`${baseUrl}${spotEndpoint}`, {
        method: 'GET',
        headers: {
          'KC-API-KEY': apiKey,
          'KC-API-SIGN': spotSig,
          'KC-API-TIMESTAMP': timestamp,
          'KC-API-PASSPHRASE': passphrase,
          'KC-API-KEY-VERSION': '2',
          'Content-Type': 'application/json'
        }
      });
      const spotData = await spotRes.json();

      // --- FUTURES ---
      let futuresData: any = { error: 'Futures API keys not configured' };
      if (futuresKey && futuresSecret && futuresPassphrase) {
        try {
          const fTs = Date.now().toString();
          const futuresEndpoint = '/api/v1/account-overview?currency=USDT';
          const futuresSig = await signRequest(fTs, 'GET', futuresEndpoint, '', futuresSecret);
          const futuresRes = await fetch(`${futuresBase}${futuresEndpoint}`, {
            method: 'GET',
            headers: {
              'KC-API-KEY': futuresKey,
              'KC-API-SIGN': futuresSig,
              'KC-API-TIMESTAMP': fTs,
              'KC-API-PASSPHRASE': futuresPassphrase,
              'KC-API-KEY-VERSION': '2',
              'Content-Type': 'application/json'
            }
          });
          futuresData = await futuresRes.json();
        } catch (err) {
          futuresData = { error: `Futures fetch failed: ${err.message}` };
        }
      }

      return new Response(JSON.stringify({
        spot: spotData,
        futures: futuresData
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'place_order' && orderData) {
      // Get min order size
      const symbolsResponse = await fetch(`${baseUrl}/api/v1/symbols`);
      const symbolsData = await symbolsResponse.json();
      const symbolInfo = symbolsData.data.find((s: any) => s.symbol === orderData.symbol);
      let orderSize = parseFloat(orderData.size);
      if (symbolInfo && orderSize < parseFloat(symbolInfo.baseMinSize)) {
        orderSize = parseFloat(symbolInfo.baseMinSize);
      }

      const endpoint = '/api/v1/orders';
      const body = JSON.stringify({
        clientOid: `lovable_${Date.now()}`,
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        size: orderSize.toString(),
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
        body
      });

      const orderResult = await response.json();
      return new Response(JSON.stringify(orderResult), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
