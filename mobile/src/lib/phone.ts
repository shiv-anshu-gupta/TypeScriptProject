/**
 * What counts as a valid Indian mobile number, for the whole app.
 *
 * @packageDocumentation
 */

/**
 * Reduces a typed number to the bare 10 digits the shop stores.
 *
 * @remarks
 * Indian mobile numbers, the one place the app agrees on what a valid one is.
 * 10 digits starting 6-9, after stripping +91 or a leading 0. Mirrors the
 * server's normalizeMobile so the app never offers to send what it will
 * reject.
 *
 * Everything that is not a digit is dropped first, so spaces, hyphens and
 * brackets are all accepted as the customer types them. A `+91` prefix is
 * removed only when the result is exactly 12 digits, and a leading `0` only
 * at 11, so a number that is simply mistyped is left alone rather than
 * quietly truncated into a different one.
 *
 * @returns The digits alone — not necessarily a valid number. Pair it with
 * {@link isValidMobile} before sending anything.
 */
export function normalizeMobile(raw: string): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0"))
    digits = digits.slice(1);
  return digits;
}

/**
 * Whether a typed number is one the server will accept.
 *
 * @remarks
 * True only for 10 digits beginning 6, 7, 8 or 9, after normalising. Used to
 * gate the phone prompt shown on a first send, and to validate the optional
 * phone field on the profile sheet — where an empty value is allowed but a
 * typed one must pass.
 */
export function isValidMobile(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeMobile(raw));
}
