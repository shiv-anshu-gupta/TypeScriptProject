/**
 * Paying the shop over UPI, with no gateway and no SDK: build a deep link and
 * hand it to whichever UPI app the customer has.
 *
 * @packageDocumentation
 */

import { Linking } from "react-native";

/**
 * Builds a standard UPI deep link. Opening it lets the customer pick any
 * installed UPI app (GPay / PhonePe / Paytm / bank app) with the amount and
 * note pre-filled. No SDK, no gateway — the money goes straight to the shop.
 *
 * @remarks
 * Because there is no gateway there is also no callback: nothing tells the
 * app whether the money moved. The shopkeeper marks the order paid once it
 * lands in their own UPI app.
 *
 * A negative or unparseable amount becomes `0.00` rather than throwing, so a
 * malformed total cannot crash the pay button — the customer's UPI app
 * refuses it instead.
 *
 * @param params - `upiId` is the shop's VPA and `payeeName` the name shown in
 * the UPI app; `note` becomes the transaction note, and carries the order
 * code so the shopkeeper can match the payment.
 * @returns A `upi://pay?...` URL for {@link openUpiPayment}.
 */
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

/**
 * Hands the deep link to the operating system.
 *
 * @remarks
 * Returns false only when the launch actually fails (no UPI app installed).
 *
 * NOTE: we intentionally do NOT gate on Linking.canOpenURL(). On Android 11+
 * canOpenURL returns false for the "upi" scheme unless it's declared in the
 * manifest's `<queries>` — a false negative even when GPay/PhonePe ARE
 * installed. openURL launches the intent regardless and throws only if
 * nothing handles it.
 *
 * True means an app opened, not that anything was paid. Never throws.
 */
export async function openUpiPayment(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
