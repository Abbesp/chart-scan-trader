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

    // Debug: se om API-nycklar saknas
    if (!apiKey || !secretKey || !passphrase) {
      console.error("❌ API-nycklar saknas. Kontrollera miljövariabler.");
      return new Response(JSON.stringify({
        success: false,
        errorMessage: 'KuCoin API keys not configured'
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, orderData, symbol, interval } = await req.json();

    const timestamp = Date.now().toString();
    const baseUrl = 'https://api.kucoin.com';

    if (action === 'place_order' && orderData) {
      try {
        // Hämta minsta orderstorlek för symbolen
        const symbolsRes = await fetch(`${baseUrl}/api/v1/symbols`);
        const symbolsJson = await symbolsRes.json();
        const symbolInfo = symbolsJson.data?.find((s: any) => s.symbol === orderData.symbol);

        if (!symbolInfo) {
          return new Response(JSON.stringify({
            success: false,
            errorMessage: `Symbol ${orderData.symbol} not found`
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const minSize = parseFloat(symbolInfo.baseMinSize);
        let orderSize = parseFloat(orderData.size);

        if (orderSize < minSize) {
          console.log(`ℹ Justerar orderstorlek från ${orderSize} till minsta tillåtna ${minSize}`);
          orderSize = minSize;
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

        if (orderResult.code !== '200000') {
          return new Response(JSON.stringify({
            success: false,
            errorMessage: orderResult.msg || 'Order failed',
            kucoinResponse: orderResult
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        await supabaseClient.from('trading_orders').insert({
          order_id: orderResult.data.orderId,
          symbol: orderData.symbol,
          side: orderData.side,
          type: orderData.type,
          size: orderSize,
          status: 'placed',
          created_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({
          success: true,
          order: orderResult.data
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      } catch (err) {
        return new Response(JSON.stringify({
          success: false,
          errorMessage: err.message
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
      errorMessage: error.message
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
