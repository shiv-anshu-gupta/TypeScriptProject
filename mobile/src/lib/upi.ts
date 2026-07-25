import { Linking } from "react-native";

// Builds a standard UPI deep link. Opening it lets the customer pick any
// installed UPI app (GPay / PhonePe / Paytm / bank app) with the amount and
// note pre-filled. No SDK, no gateway — the money goes straight to the shop.
export function buildUpiUrl(params: {
  upiId: string;
  payeeName: string;
  amount: number;
  note: string;
}): string {
  // UPI expects the amount as a decimal string with 2 places (e.g. "450.00").
  // Some apps reject a bare integer, so always format it.
  const amount = Math.max(0, Number(params.amount) || 0).toFixed(2);

  const query = [
    `pa=${encodeURIComponent(params.upiId)}`, // payee address (VPA)
    `pn=${encodeURIComponent(params.payeeName)}`, // payee name
    `am=${amount}`, // amount
    `cu=INR`, // currency
    `tn=${encodeURIComponent(params.note)}`, // transaction note
  ].join("&");

  return `upi://pay?${query}`;
}

// Returns false only when the launch actually fails (no UPI app installed).
//
// NOTE: we intentionally do NOT gate on Linking.canOpenURL(). On Android 11+
// canOpenURL returns false for the "upi" scheme unless it's declared in the
// manifest's <queries> — a false negative even when GPay/PhonePe ARE installed.
// openURL launches the intent regardless and throws only if nothing handles it.
export async function openUpiPayment(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
