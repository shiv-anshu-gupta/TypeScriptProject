/**
 * The shared Razorpay client and the unit conversion its API expects.
 *
 * @packageDocumentation
 */
import Razorpay from "razorpay";

/**
 * Reads an environment variable that the server cannot run without.
 *
 * @throws Error when the variable is unset or empty. This runs while the
 * module is being imported, so a missing key stops the process at boot rather
 * than failing the first customer who tries to pay.
 */
function checkEnv(name: string): string {
  const extractValue = process.env[name];

  if (!extractValue) {
    throw new Error(`Missing env: ${name}`);
  }

  return extractValue;
}

/**
 * The process-wide Razorpay client, used to create and verify payment orders.
 *
 * @remarks
 * Built at import time from `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; if
 * either is missing the import throws and the server does not start. The
 * secret stays on the server - only the key id is ever sent to a client.
 */
export const razorpay = new Razorpay({
  key_id: checkEnv("RAZORPAY_KEY_ID"),
  key_secret: checkEnv("RAZORPAY_KEY_SECRET"),
});

/**
 * Converts rupees to the paise that Razorpay's API takes.
 *
 * @remarks
 * Razorpay works entirely in the smallest currency unit, so every amount
 * stored here in rupees must be multiplied by 100 before it is sent. Rounded,
 * not truncated, so a total that ends up as a fraction of a paisa through
 * a percentage discount does not quietly lose money.
 *
 * @param amount - the total in rupees.
 * @returns The same amount in paise, as a whole number.
 */
export function toSubUnits(amount: number) {
  return Math.round(amount * 100);
}
