// Normalise an Indian mobile number to 10 digits (strips +91 / leading 0 /
// spaces). Returns "" if it isn't a valid mobile.
export function normalizeMobile(raw: unknown): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
}
