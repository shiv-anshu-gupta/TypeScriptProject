// Block "special characters" as the customer types, in every field the shop
// will read: grocery lines, the profile name, the name given at sign-up.
//
// Letters (English AND Hindi), digits, spaces, the punctuation real names use
// (. , & ' - / ( ) %) and the multiplication sign in pack quantities stay;
// the dangerous ASCII specials go. A blocklist (not a \p{L} allowlist) so it is
// safe on Hermes; the server enforces the strict allowlist on top.
const DISALLOWED_SPECIALS = /[!"#$*+:;<=>?@^_`{|}~[\]\\]/g;

export function stripSpecials(value: string): string {
  return (value ?? "").replace(DISALLOWED_SPECIALS, "");
}
