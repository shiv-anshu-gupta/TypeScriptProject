/**
 * The app's one rule for which characters a customer may type into a field the
 * shop will read.
 *
 * @packageDocumentation
 */
// Block "special characters" as the customer types, in every field the shop
// will read: grocery lines, the profile name, the name given at sign-up.
//
// Letters (English AND Hindi), digits, spaces, the punctuation real names use
// (. , & ' - / ( ) %) and the multiplication sign in pack quantities stay;
// the dangerous ASCII specials go. A blocklist (not a \p{L} allowlist) so it is
// safe on Hermes; the server enforces the strict allowlist on top.
const DISALLOWED_SPECIALS = /[!"#$*+:;<=>?@^_`{|}~[\]\\]/g;

/**
 * Removes the blocked characters from typed text.
 *
 * @remarks
 * Applied on every keystroke, not on submit, so the field never shows a
 * character that would later vanish. Every write to a draft row goes through
 * it, and so do the profile name and the name given at sign-up.
 *
 * It removes and never rejects: a name made entirely of blocked characters
 * comes back as an empty string rather than an error. Hindi, English, digits,
 * spaces, `.` `,` `&` `'` `-` `/` `(` `)` `%` and `×` all survive.
 *
 * A nullish value is tolerated and answers `""`, because callers pass a
 * `TextInput` value straight through.
 */
export function stripSpecials(value: string): string {
  return (value ?? "").replace(DISALLOWED_SPECIALS, "");
}
