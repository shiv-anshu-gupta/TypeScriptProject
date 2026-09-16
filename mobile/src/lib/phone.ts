// Indian mobile numbers, the one place the app agrees on what a valid one is.
// 10 digits starting 6-9, after stripping +91 or a leading 0. Mirrors the
// server's normalizeMobile so the app never offers to send what it will
// reject.
export function normalizeMobile(raw: string): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0"))
    digits = digits.slice(1);
  return digits;
}

export function isValidMobile(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeMobile(raw));
}
