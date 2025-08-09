import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const KUCOIN_API_KEY = Deno.env.get("KUCOIN_API_KEY") ?? "";
const KUCOIN_API_SECRET = Deno.env.get("KUCOIN_API_SECRET") ?? "";
const KUCOIN_API_PASSPHRASE = Deno.env.get("KUCOIN_API_PASSPHRASE") ?? "";

if (!KUCOIN_API_KEY || !KUCOIN_API_SECRET || !KUCOIN_API_PASSPHRASE) {
  console.error("❌ KuCoin API credentials are missing in environment variables.");
}

// KuCoin request signing
async function signRequest(
  timestamp: string,
  method: string,
  endpoint: string,
  body: string,
  secret: string
) {
  const message = timestamp + method.toUpperCase() + endpoint + body;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const json = req.headers.get("content-type")?.includes("application/json")
      ? await req.json()
      : {};
    const { symbol, side, type, size, stopPrice } = json as Record<string, any>;

    if (!symbol || !side || !type || !size) {
      return new Response(JSON.stringify({ error: "Missing required order parameters (symbol, side, type, size)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const timestamp = Date.now().toString();
    const endpoint = "/api/v1/orders";
    const body = JSON.stringify({
      symbol,
      side,
      type,
      size,
      ...(stopPrice ? { stopPrice } : {}),
    });

    // Loggar begäran (utan nycklar)
    console.log("📤 Sending order to KuCoin:", {
      timestamp,
      endpoint,
      payload: JSON.parse(body)
    });

    const signature = await signRequest(timestamp, "POST", endpoint, body, KUCOIN_API_SECRET);
    const passphraseSig = await signRequest(timestamp, "POST", "", KUCOIN_API_PASSPHRASE, KUCOIN_API_SECRET);

    const kucoinRes = await fetch(`https://api.kucoin.com${endpoint}`, {
      method: "POST",
      headers: {
        "KC-API-KEY": KUCOIN_API_KEY,
        "KC-API-SIGN": signature,
        "KC-API-TIMESTAMP": timestamp,
        "KC-API-PASSPHRASE": passphraseSig,
        "KC-API-KEY-VERSION": "2",
        "Content-Type": "application/json",
      },
      body,
    });

    const resultText = await kucoinRes.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }

    // Loggar svar
    console.log("📥 KuCoin response:", {
      status: kucoinRes.status,
      body: result
    });

    return new Response(JSON.stringify({
      status: kucoinRes.status,
      kucoinResponse: result
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ KuCoin API error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
