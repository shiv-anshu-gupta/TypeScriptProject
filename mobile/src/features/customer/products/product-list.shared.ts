/**
 * Helpers and fixed option lists shared by the catalogue screens.
 *
 * @remarks
 * Kept apart from `types.ts` because these are values, not shapes, and both
 * the Shop grid and the details screen need them.
 *
 * @packageDocumentation
 */

import type { CustomerProduct } from "./types";

/**
 * Brands the filter UI would offer.
 *
 * @remarks
 * An apparel leftover, hard-coded rather than read from the catalogue. No
 * screen currently shows a brand filter, so nothing renders this — but the
 * hook behind Shop does support filtering by brand.
 */
export const BRAND_OPTIONS = [
  "Nike",
  "Adidas",
  "Puma",
  "Zara",
  "H&M",
  "Levi's",
  "Uniqlo",
  "Mango",
  "Calvin Klein",
  "Tommy Hilfiger",
];

/**
 * Sizes the filter UI would offer.
 *
 * @remarks
 * Matches `ProductSize`. Another apparel leftover with no UI at present.
 */
export const SIZE_OPTIONS = ["S", "M", "L", "XL"] as const;

const COLOR_MAP: Record<string, string> = {
  black: "#111111",
  white: "#f5f5f5",
  grey: "#6b7280",
  gray: "#6b7280",
  blue: "#2563eb",
  navy: "#1e3a8a",
  red: "#c0492f",
  green: "#4f7a4d",
  olive: "#4d5b2b",
  yellow: "#eab308",
  beige: "#d6c2a1",
  cream: "#ede8d8",
  brown: "#7c4a2d",
  tan: "#b9936c",
  pink: "#ec4899",
  purple: "#9333ea",
  orange: "#f97316",
  maroon: "#7f1d1d",
};

/**
 * Which filter a value belongs to.
 *
 * @remarks
 * Used to toggle one filter by key, so a single handler serves every chip
 * instead of one per facet.
 */
export type FacetKey = "category" | "brand" | "color" | "size";

/**
 * The catalogue filters as the screen holds them.
 *
 * @remarks
 * Every field is a string and `""` means "not filtering", rather than
 * `undefined` — a `TextInput` and a chip both produce strings, and the api
 * layer drops the empties on its way out.
 */
export type CustomerProductFilters = {
  category: string;
  brand: string;
  color: string;
  size: string;
};

/**
 * One "you are filtering by this" chip.
 *
 * @remarks
 * `value` is already resolved for display — a category shows its name, not
 * its id — while `key` is what a tap passes back to clear it.
 */
export type ActiveFilterBadge = {
  key: FacetKey;
  label: string;
  value: string;
};

/**
 * The picture to show for a product.
 *
 * @remarks
 * The image marked as cover, then the first one, then `""`. The empty string
 * is deliberate: cards render a placeholder for it, so a product with no
 * pictures is still tappable.
 */
export function getCoverImage(product: CustomerProduct) {
  return (
    product.images.find((item) => item.isCover)?.url ||
    product.images[0]?.url ||
    ""
  );
}

/**
 * Turns a colour name into something that can be painted.
 *
 * @remarks
 * Looks the name up in a small table of the colours the shop actually uses,
 * and otherwise hands the string straight back — so a name a CSS colour
 * already covers still works, and an unknown one degrades to whatever the
 * platform makes of it rather than throwing.
 */
export function getSwatchColor(color: string) {
  const normalized = color.trim().toLowerCase();

  return COLOR_MAP[normalized] || color;
}
