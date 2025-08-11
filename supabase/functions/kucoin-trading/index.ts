import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface KuCoinOrderRequest {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  size?: string;
  stopPrice?: string;
  leverage?: number;
  tradingType?: "spot" | "futures";
}

// Sign request helper
async function signRequest(
  timestamp: string,
  method: string,
  endpoint: string,
  body: string,
  secret: string,
) {
  const message = timestamp + method + endpoint + body;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Fetch min order size
async function getBaseMinSize(symbol: string, isFutures: boolean) {
  const baseUrl = isFutures
    ? "https://api-futures.kucoin.com"
    : "https://api.kucoin.com";
  const endpoint = isFutures ? "/api/v1/contracts/active" : "/api/v1/symbols";

  try {
    const res = await fetch(`${baseUrl}${endpoint}`);
    const data = await res.json();

    if (isFutures) {
      const contract = data.data.find((c: any) => c.symbol === symbol);
      return contract?.baseMinSize
        ? parseFloat(contract.baseMinSize)
        : undefined;
    } else {
      const spotSymbol = data.data.find((s: any) => s.symbol === symbol);
      return spotSymbol?.baseMinSize
        ? parseFloat(spotSymbol.baseMinSize)
        : undefined;
    }
  } catch {
    return undefined;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const apiKey = Deno.env.get("KUCOIN_API_KEY");
    const secretKey = Deno.env.get("KUCOIN_API_SECRET");
    const passphrase = Deno.env.get("KUCOIN_API_PASSPHRASE");

    if (!apiKey || !secretKey || !passphrase) {
      return new Response(
        JSON.stringify({ error: "KuCoin API keys not configured" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { action, orderData, symbol, interval } = await req.json();

    const timestamp = Date.now().toString();
    const baseUrl = "https://api.kucoin.com";

    // GET ACCOUNT
    if (action === "get_account") {
      const endpoint = "/api/v1/accounts";
      const signature = await signRequest(
        timestamp,
        "GET",
        endpoint,
        "",
        secretKey,
      );

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          "KC-API-KEY": apiKey,
          "KC-API-SIGN": signature,
          "KC-API-TIMESTAMP": timestamp,
          "KC-API-PASSPHRASE": passphrase,
          "KC-API-KEY-VERSION": "2",
        },
      });

      return new Response(await response.text(), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET MARKET DATA
    if (action === "get_market_data") {
      try {
        const symbolsRes = await fetch(`${baseUrl}/api/v1/symbols`);
        const tickerRes = await fetch(`${baseUrl}/api/v1/market/allTickers`);

        const symbolsData = await symbolsRes.json();
        const tickerData = await tickerRes.json();

        const usdtSymbols = symbolsData.data
          ?.filter((s: any) => s.quoteCurrency === "USDT" && s.enableTrading)
          ?.slice(0, 8)
          ?.map((s: any) => s.symbol);

        const prices: Record<string, number> = {};
        tickerData.data?.ticker?.forEach((t: any) => {
          if (usdtSymbols.includes(t.symbol)) {
            prices[t.symbol] = parseFloat(t.last);
          }
        });

        return new Response(
          JSON.stringify({ symbols: usdtSymbols, prices, code: "200000" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message, code: "500000" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // GET KLINE
    if (action === "get_kline_data" && symbol && interval) {
      const url =
        `${baseUrl}/api/v1/market/candles?symbol=${symbol}&type=${interval}&startAt=${Math.floor(Date.now() / 1000) - 86400}&endAt=${Math.floor(Date.now() / 1000)}`;
      const res = await fetch(url);
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PLACE ORDER
    if (action === "place_order" && orderData) {
      const isFutures = orderData.tradingType === "futures";
      let size = orderData.size ? parseFloat(orderData.size) : undefined;

      // If futures & no size, auto-calc
      if (isFutures && (!size || size <= 0)) {
        const minSize = await getBaseMinSize(orderData.symbol, true);
        const leverage = orderData.leverage || 5;
        size = minSize ? minSize * leverage : 1 * leverage;
      }

      const endpoint = isFutures
        ? "/api/v1/orders" // KuCoin Futures orders endpoint kan ändras
        : "/api/v1/orders";
      const url = isFutures
        ? "https://api-futures.kucoin.com"
        : "https://api.kucoin.com";

      const body = JSON.stringify({
        clientOid: `lovable_${Date.now()}`,
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        size: size?.toString(),
        ...(orderData.stopPrice && {
          stop: "loss",
          stopPrice: orderData.stopPrice,
        }),
      });

      const signature = await signRequest(
        timestamp,
        "POST",
        endpoint,
        body,
        secretKey,
      );

      const response = await fetch(`${url}${endpoint}`, {
        method: "POST",
        headers: {
          "KC-API-KEY": apiKey,
          "KC-API-SIGN": signature,
          "KC-API-TIMESTAMP": timestamp,
          "KC-API-PASSPHRASE": passphrase,
          "KC-API-KEY-VERSION": "2",
          "Content-Type": "application/json",
        },
        body,
      });

      const orderResult = await response.json();

      if (orderResult.code === "200000") {
        await supabaseClient.from("trading_orders").insert({
          order_id: orderResult.data.orderId,
          symbol: orderData.symbol,
          side: orderData.side,
          type: orderData.type,
          size: size?.toString(),
          status: "placed",
          created_at: new Date().toISOString(),
        });
      }

      return new Response(
        JSON.stringify({
          ...orderResult,
          debug: { sizeCalculated: size, isFutures },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
