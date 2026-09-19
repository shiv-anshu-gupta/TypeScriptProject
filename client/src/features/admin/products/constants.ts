/**
 * Fixed option lists used by the admin products screens.
 *
 * @remarks
 * Only {@link UNIT_OPTIONS} is live. {@link SIZE_OPTIONS} is a leftover from
 * the shop's cloth-selling era and is kept purely so the dead customer pages
 * still compile.
 *
 * @packageDocumentation
 */

import type { ProductUnit } from "./types";

/**
 * The units a shopkeeper can pick in the product dialog.
 *
 * @remarks
 * Rendered as the unit `Select` in `product-dialog.tsx`, paired with the free
 * `unitValue` number (10 + `kg` for a 10 kg bag).
 *
 * The server validates against its own enum, so adding a value here without
 * adding it to the backend Product model produces a 400 on save.
 */
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

/**
 * Garment sizes. Dead code, kept only to satisfy the compiler.
 *
 * @remarks
 * A leftover from when the shop sold cloth. No admin screen reads it: the only
 * importers are the customer web pages under `client/src/pages/customer/` and
 * `client/src/components/customer/`, and `router.tsx` renders none of those.
 * Grocery products have a unit, not a size. Delete this together with those
 * pages.
 */
// Legacy (cloth era): only referenced by the old, no-longer-routed customer
// web pages. Kept so those files still compile until they're deleted.
export const SIZE_OPTIONS = ["S", "M", "L", "XL"] as const;
