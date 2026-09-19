/**
 * One way of writing a customer's mobile number.
 *
 * @packageDocumentation
 */

/**
 * Normalise an Indian mobile number to 10 digits (strips +91 / leading 0 /
 * spaces). Returns "" if it isn't a valid mobile.
 *
 * @remarks
 * Every non-digit is dropped first, so the same number typed as
 * `+91 98765 43210`, `098765-43210` or `9876543210` all normalise to the same
 * ten digits - which is what lets the shop recognise a returning customer.
 *
 * Valid means an Indian mobile: exactly ten digits starting 6, 7, 8 or 9.
 * Landlines and foreign numbers are rejected.
 *
 * @returns The ten digits, or `""` when the input is not a valid mobile. The
 * empty string is the only failure signal - nothing is thrown.
 */
export function normalizeMobile(raw: unknown): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
}
