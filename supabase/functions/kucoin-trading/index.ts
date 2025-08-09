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

// KuCoin passphrase encryption
async function encryptPassphrase(passphrase: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(passphrase));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
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
    const rawPassphrase = Deno.env.get('KUCOIN_API_PASSPHRASE');

    if (!apiKey || !secretKey || !rawPassphrase) {
      return new Response(
        JSON.stringify({ error: 'KuCoin API keys not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const passphrase = await encryptPassphrase(rawPassphrase, secretKey);

    const { action, orderData, symbol, interval } = await req.json() as { 
      action: 'place_order' | 'get_account' | 'get_market_data' | 'get_kline_data'; 
      orderData?: KuCoinOrderRequest;
      symbol?: string;
      interval?: string;
    };

    const timestamp = Date.now().toString();
    const baseUrl = 'https://api.kucoin.com';

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
      return new Response(JSON.stringify(accountData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'place_order' && orderData) {
      const endpoint = '/api/v1/orders';
      const body = JSON.stringify({
        clientOid: `lovable_${Date.now()}`,
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        size: orderData.size,
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

      if (orderResult.code === '200000') {
        await supabaseClient
          .from('trading_orders')
          .insert({
            order_id: orderResult.data.orderId,
            symbol: orderData.symbol,
            side: orderData.side,
            type: orderData.type,
            size: orderData.size,
            status: 'placed',
            created_at: new Date().toISOString()
          });
      }

      return new Response(JSON.stringify(orderResult), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
