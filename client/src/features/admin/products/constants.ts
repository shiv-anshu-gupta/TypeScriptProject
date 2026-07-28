import type { ProductUnit } from "./types";

// How a grocery item is sold — mirrors the backend Product model's unit enum.
export const UNIT_OPTIONS: ProductUnit[] = [
  "kg",
  "g",
  "litre",
  "ml",
  "piece",
  "dozen",
  "pack",
];

// Legacy (cloth era): only referenced by the old, no-longer-routed customer
// web pages. Kept so those files still compile until they're deleted.
export const SIZE_OPTIONS = ["S", "M", "L", "XL"] as const;
