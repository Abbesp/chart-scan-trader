import { placeOrder } from "../lib/api";

export default function OrderButton() {
  async function onBuy() {
    try {
      const payload = {
        action: "place_order",
        orderData: {
          symbol: "CHR-USDT",
          side: "buy",
          type: "market",
          size: "0.1",
          tradingType: "spot"
        }
      };
      const result = await placeOrder(payload);
      alert("Order skickad: " + JSON.stringify(result));
    } catch (err) {
      alert("Orderfel: " + err.message);
    }
  }

  return <button onClick={onBuy}>Köp CHR</button>;
}
