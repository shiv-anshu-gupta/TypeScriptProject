export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
};

export type RazorpayPaymentResult = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

/**
 * Razorpay's React Native SDK (`react-native-razorpay`) is a NATIVE module and
 * does NOT work in Expo Go — it requires a custom dev build / prebuild.
 *
 * To keep the app runnable in Expo Go, card checkout is disabled here and the
 * fully-working "Pay with points" flow should be used instead.
 *
 * TO ENABLE REAL CARD PAYMENTS (in a dev build):
 *   1. npm install react-native-razorpay
 *   2. npx expo prebuild   (generates native android/ios projects)
 *   3. npx expo run:android   (or run:ios)  — builds a dev client
 *   4. Replace the body of this function with:
 *
 *        import RazorpayCheckout from "react-native-razorpay";
 *        export async function openRazorpayCheckout(options: RazorpayOptions) {
 *          return RazorpayCheckout.open(options) as Promise<RazorpayPaymentResult>;
 *        }
 */
export async function openRazorpayCheckout(
  _options: RazorpayOptions,
): Promise<RazorpayPaymentResult> {
  throw new Error(
    "Card payment needs a dev build. Use 'Pay with points' in Expo Go.",
  );
}
