// File: src/lib/api.ts
export async function callBackend(payload: any) {
  const res = await fetch("/.netlify/functions/trade" /* eller din edge URL */, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await res.json().catch(() => ({}));
  if (j.kucoin?.msg) throw new Error(`KuCoin: ${j.kucoin.msg} (code ${j.kucoin.code})`);
  if (!j.success && j.error) throw new Error(j.error);
  if (!j.success && j.kucoin) throw new Error(JSON.stringify(j.kucoin));
  return j;
}

export async function placeOrder(payload) {
  return callBackend(payload);
}
