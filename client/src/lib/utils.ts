/**
 * Two small helpers used throughout the app.
 *
 * @packageDocumentation
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins class names and resolves conflicting Tailwind utilities.
 *
 * @remarks
 * The standard shadcn helper. `clsx` flattens conditionals and arrays;
 * `twMerge` then makes the last conflicting utility win, so a caller's
 * `className` can override a component's default padding or colour rather than
 * fighting it on specificity.
 *
 * @param inputs - Class names, conditionals, arrays or objects.
 * @returns One de-duplicated class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian rupees with no paise.
 *
 * @remarks
 * `en-IN` grouping, so 125000 renders as ₹1,25,000 — lakh-style, not
 * thousands-style. `maximumFractionDigits: 0` rounds for display only; it does
 * not change the stored value, and the shop prices in whole rupees anyway.
 *
 * @param val - An amount in rupees.
 * @returns The formatted string, including the ₹ symbol.
 */
export function formatPrice(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}
