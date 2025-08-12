// File: supabase/functions/<ditt-funktionsnamn>/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

interface KuCoinOrderRequest {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  size?: string;         // för spot: amount i base currency
  leverage?: string;     // för futures (som "5" eller "10")
  tradingType?: "spot" | "futures";
  stopPrice?: string;
}

// --- Signing helpers enligt KuCoin docs ---
async function hmacBase64(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function buildHeadersForKucoin(
  method: string,
  requestPath: string,
  body: string,
  apiKey: string,
  apiSecret: string,
  apiPassphrase: string,
  keyVersion = "2"
) {
  const timestamp = Date.now().toString();
  const methodUpper = method.toUpperCase();
  const prehash = timestamp + methodUpper + requestPath + body;
  const signature = await hmacBase64(apiSecret, prehash);

  // For key version >=2 you must HMAC-SHA256(passphrase) with API secret and base64 it
  let passphraseHeader = apiPassphrase;
  if (keyVersion !== undefined && keyVersion !== "1") {
    passphraseHeader = await hmacBase64(apiSecret, apiPassphrase);
  }

  return {
    "KC-API-KEY": apiKey,
    "KC-API-SIGN": signature,
    "KC-API-TIMESTAMP": timestamp,
    "KC-API-PASSPHRASE": passphraseHeader,
    "KC-API-KEY-VERSION": keyVersion,
    "Content-Type": "application/json"
  };
}

// --- Helpers för minsta orderstorlek ---
async function fetchSpotMinSize(symbol: string) {
  const baseUrl = "https://api.kucoin.com";
  try {
    const res = await fetch(`${baseUrl}/api/v1/symbols`);
    const j = await res.json();
    if (!j.data) return undefined;
    const s = j.data.find((x: any) => x.symbol === symbol);
    return s ? parseFloat(s.baseMinSize) : undefined;
  } catch {
    return undefined;
  }
}

async function fetchFuturesMinSize(symbol: string) {
  // futures contracts active endpoint
  const baseUrl = "https://api-futures.kucoin.com";
  try {
    // Try contract details endpoint first (if available)
    const tryUrl = `${baseUrl}/api/v1/contracts/${symbol}`;
    const r = await fetch(tryUrl);
    if (r.ok) {
      const j = await r.json();
      // some contract responses use j.data.lotSize or j.data.baseMinSize
      const val = j.data?.lotSize ?? j.data?.baseMinSize ?? j.data?.size;
      return val ? parseFloat(val) : undefined;
    }
    // fallback: fetch active contracts list
    const listRes = await fetch(`${baseUrl}/api/v1/contracts/active`);
    const listJson = await listRes.json();
    const c = listJson.data?.find((x: any) => x.symbol === symbol);
    const val = c?.lotSize ?? c?.baseMinSize;
    return val ? parseFloat(val) : undefined;
  } catch {
    return undefined;
  }
}

// --- Serve ---
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // required envs
    const KUCOIN_API_KEY = Deno.env.get("KUCOIN_API_KEY") ?? "";
    const KUCOIN_API_SECRET = Deno.env.get("KUCOIN_API_SECRET") ?? "";
    const KUCOIN_API_PASSPHRASE = Deno.env.get("KUCOIN_API_PASSPHRASE") ?? "";
    const KUCOIN_API_KEY_VERSION = Deno.env.get("KUCOIN_API_KEY_VERSION") ?? "2"; // 1|2|3

    if (!KUCOIN_API_KEY || !KUCOIN_API_SECRET || !KUCOIN_API_PASSPHRASE) {
      console.error("Missing KuCoin env vars");
      return new Response(JSON.stringify({ success: false, error: "KuCoin API keys not configured" }), { headers: CORS_HEADERS });
    }

    const payload = await req.json().catch(() => ({}));
    const action = payload.action;
    const orderData: KuCoinOrderRequest | undefined = payload.orderData;
    const symbol: string | undefined = payload.symbol;
    const interval: string | undefined = payload.interval;
    const tradingType: string | undefined = payload.tradingType; // optional, forwarded from frontend

    const baseUrl = "https://api.kucoin.com";
    const futuresBase = "https://api-futures.kucoin.com";

    // -----------------------
    // get_account
    // -----------------------
    if (action === "get_account") {
      // if frontend requests futures account, return mocked balance (prevents failures)
      if (payload.tradingType === "futures") {
        return new Response(JSON.stringify({
          code: "200000",
          mock: true,
          data: [{ currency: "USDT", available: "100000", balance: "100000", type: "trade" }]
        }), { headers: CORS_HEADERS });
      }

      // real spot account request
      const endpoint = "/api/v1/accounts";
      const headers = await buildHeadersForKucoin("GET", endpoint, "", KUCOIN_API_KEY, KUCOIN_API_SECRET, KUCOIN_API_PASSPHRASE, KUCOIN_API_KEY_VERSION);
      const r = await fetch(`${baseUrl}${endpoint}`, { method: "GET", headers });
      const j = await r.json();
      return new Response(JSON.stringify(j), { headers: CORS_HEADERS });
    }

    // -----------------------
    // get_market_data
    // -----------------------
    if (action === "get_market_data") {
      const [symbolsRes, tickersRes] = await Promise.all([
        fetch(`${baseUrl}/api/v1/symbols`),
        fetch(`${baseUrl}/api/v1/market/allTickers`)
      ]);
      const symbols = await symbolsRes.json();
      const tickers = await tickersRes.json();
      return new Response(JSON.stringify({ success: true, symbols: symbols.data, tickers: tickers.data }), { headers: CORS_HEADERS });
    }

    // -----------------------
    // get_kline_data
    // -----------------------
    if (action === "get_kline_data" && symbol && interval) {
      const endpoint = `/api/v1/market/candles?symbol=${encodeURIComponent(symbol)}&type=${encodeURIComponent(interval)}&startAt=${Math.floor(Date.now()/1000)-86400}&endAt=${Math.floor(Date.now()/1000)}`;
      const r = await fetch(`${baseUrl}${endpoint}`);
      const j = await r.json();
      return new Response(JSON.stringify({ success: j.code === "200000", klineData: j.data || [], raw: j }), { headers: CORS_HEADERS });
    }

    // -----------------------
    // place_order
    // -----------------------
    if (action === "place_order" && orderData) {
      // determine if futures
      const isFutures = (orderData.tradingType ?? tradingType) === "futures";

      // --- get min size (try API) ---
      let minSize: number | undefined;
      if (isFutures) {
        minSize = await fetchFuturesMinSize(orderData.symbol);
      } else {
        minSize = await fetchSpotMinSize(orderData.symbol);
      }

      // fallback if not found
      if (!minSize || Number.isNaN(minSize)) minSize = 1;

      // compute final size
      let finalSize = orderData.size ? parseFloat(orderData.size) : 0;
      if (!orderData.size || finalSize <= 0) {
        // if user didn't send size, use minSize
        finalSize = minSize;
      }
      // if below min, bump to min
      if (finalSize < minSize) finalSize = minSize;

      // if futures + leverage given, multiply
      if (isFutures && orderData.leverage) {
        const lev = parseFloat(orderData.leverage.toString()) || 1;
        finalSize = Math.max(finalSize, minSize * lev);
      }

      // build body to send to KuCoin
      const requestBodyObj: any = {
        clientOid: `order_${Date.now()}`,
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        size: finalSize.toString()
      };
      if (orderData.stopPrice) {
        requestBodyObj.stop = "loss";
        requestBodyObj.stopPrice = orderData.stopPrice;
      }
      // futures may require leverage field in their API — include if present
      if (isFutures && orderData.leverage) {
        requestBodyObj.leverage = orderData.leverage.toString();
      }

      const bodyString = JSON.stringify(requestBodyObj);

      // choose endpoint + url
      const endpoint = "/api/v1/orders";
      const url = isFutures ? `${futuresBase}${endpoint}` : `${baseUrl}${endpoint}`;

      // build headers (pass the same secret/key/passphrase; if you use separate futures keys you'd adjust here)
      const headers = await buildHeadersForKucoin("POST", endpoint, bodyString, KUCOIN_API_KEY, KUCOIN_API_SECRET, KUCOIN_API_PASSPHRASE, KUCOIN_API_KEY_VERSION);

      // Make request
      const kuRes = await fetch(url, { method: "POST", headers, body: bodyString });
      const kuJson = await kuRes.json();

      // Log (server side)
      console.log("PLACE_ORDER ->", { requestBodyObj, url, kuJson });

      // If KuCoin returned an error, forward details to frontend
      if (kuJson && kuJson.code && kuJson.code !== "200000") {
        return new Response(JSON.stringify({ success: false, kucoin: kuJson, debug: { finalSize, minSize, isFutures } }), { headers: CORS_HEADERS });
      }

      // Save order to supabase if success
      if (kuJson && kuJson.code === "200000" && kuJson.data) {
        try {
          await supabaseClient.from("trading_orders").insert({
            order_id: kuJson.data.orderId ?? null,
            symbol: orderData.symbol,
            side: orderData.side,
            type: orderData.type,
            size: finalSize.toString(),
            status: "placed",
            created_at: new Date().toISOString()
          });
        } catch (e) {
          console.error("Could not insert trading_orders:", e);
        }
      }

      // Return the kucoin response plus debug info
      return new Response(JSON.stringify({ success: kuJson.code === "200000", kucoin: kuJson, debug: { finalSize, minSize, isFutures } }), { headers: CORS_HEADERS });
    }

    // default
    return new Response(JSON.stringify({ success: false, error: "Invalid action" }), { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { headers: CORS_HEADERS });
  }
});
