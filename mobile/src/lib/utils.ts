import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

// A product's pack label: a 10 kg bag shows "10 kg", a loose/single item just
// shows its unit ("kg", "piece"). Keeps the customer from seeing "1 kg" when
// the pack is actually 10 kg.
export function formatPack(unit?: string, unitValue?: number) {
  const u = (unit ?? "").trim();
  if (!u) return "";
  return unitValue && unitValue !== 1 ? `${unitValue} ${u}` : u;
}
