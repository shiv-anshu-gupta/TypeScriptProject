/**
 * Small formatting and class-name helpers with no home of their own.
 *
 * @packageDocumentation
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins NativeWind class names, with later Tailwind classes winning.
 *
 * @remarks
 * `clsx` handles the conditional forms (arrays, objects, falsy values);
 * `tailwind-merge` then drops earlier classes from the same group, so a
 * component's default `px-4` can be overridden by a caller's `px-2` instead
 * of both being emitted and the outcome depending on class order.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an amount as Indian rupees, whole rupees only.
 *
 * @remarks
 * Indian digit grouping (1,00,000 rather than 100,000) and no paise — the
 * shop prices in whole rupees, and a trailing `.00` on every line makes a
 * priced list harder to scan.
 */
export function formatPrice(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

/**
 * A product's pack label: a 10 kg bag shows "10 kg", a loose/single item just
 * shows its unit ("kg", "piece"). Keeps the customer from seeing "1 kg" when
 * the pack is actually 10 kg.
 *
 * @remarks
 * A `unitValue` of 1 means "sold loose or singly", not "a one-unit pack", so
 * it is deliberately treated the same as a missing value.
 *
 * @returns The label, or `""` when there is no unit — callers render that as
 * nothing rather than as an empty badge.
 */
export function formatPack(unit?: string, unitValue?: number) {
  const u = (unit ?? "").trim();
  if (!u) return "";
  return unitValue && unitValue !== 1 ? `${unitValue} ${u}` : u;
}
