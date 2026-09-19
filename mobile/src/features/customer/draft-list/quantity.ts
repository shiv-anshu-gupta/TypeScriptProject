/**
 * Turning a product's unit and a chosen amount into the quantity string the
 * shopkeeper reads.
 *
 * @remarks
 * Pure functions, no React and no store, so the quantity picker and the
 * product details screen can share every rule. What they produce is free
 * text: the shop reads it, nothing parses it back.
 *
 * `unitValue` means the pack size. A value of 1, or none at all, means the
 * product is sold loose or singly — it is not "a pack of one".
 *
 * @packageDocumentation
 */

// Turning a product's unit + a chosen amount into the free-text quantity the
// shop reads on the list. Two shapes:
//   • countable  — pieces / dozen / pack / a pre-packed size (e.g. a 10 kg bag):
//     the customer picks a whole count.  "2 × 10 kg", "3 pieces", "1 dozen".
//   • loose      — kg / g / litre / ml sold loose: the customer picks an amount.
//     "2.5 kg", "500 g".

/**
 * Whether this product is ordered in whole units rather than by amount.
 *
 * @remarks
 * The question behind every other function here: countable products get a
 * whole-number count ("3 pieces"), loose ones get an amount ("2.5 kg").
 *
 * A product with no unit at all counts as countable, so an item the shop
 * never gave a unit still gets a sensible "1 piece" rather than a bare
 * number.
 */
export function isCountableUnit(unit?: string, unitValue?: number): boolean {
  // A packaged product (unitValue is a real pack size like 10) is always
  // counted in whole packs, whatever its base unit is.
  if (typeof unitValue === "number" && unitValue !== 1) return true;
  return unit === "piece" || unit === "dozen" || unit === "pack" || !unit;
}

/**
 * What the picker starts at when it opens.
 *
 * @remarks
 * 250 for grams and millilitres, because 1 g is never what anybody wants;
 * 1 for everything else.
 */
export function defaultQuantityValue(
  unit?: string,
  unitValue?: number,
): number {
  if (isCountableUnit(unit, unitValue)) return 1;
  if (unit === "g" || unit === "ml") return 250;
  return 1; // kg, litre
}

/**
 * How much one tap of + or − moves the amount.
 *
 * @remarks
 * Only meaningful for loose units — countable products step by a whole 1,
 * which the picker applies itself.
 */
export function stepFor(unit?: string): number {
  if (unit === "g" || unit === "ml") return 50;
  return 0.5; // kg, litre
}

/**
 * The smallest amount a line may ask for, in the product's own unit.
 *
 * @remarks
 * One step, so the minimum is always reachable by stepping down and the
 * picker never stops at a value it cannot show.
 */
export function minFor(unit?: string, unitValue?: number): number {
  if (isCountableUnit(unit, unitValue)) return 1;
  if (unit === "g" || unit === "ml") return 50;
  return 0.5;
}

/**
 * Quick-tap presets, expressed in the product's own unit so the resulting
 * quantity string stays unambiguous.
 *
 * @remarks
 * Every preset is within {@link maxFor} for its unit, so tapping one can
 * never be silently clamped.
 *
 * Countable units fall through to the kg presets, which the picker does not
 * show — it offers whole counts instead.
 */
export function quickChips(unit?: string): number[] {
  switch (unit) {
    case "g":
      return [100, 250, 500];
    case "ml":
      return [100, 250, 500];
    case "litre":
      return [0.5, 1, 2, 5];
    case "kg":
    default:
      return [0.5, 1, 2, 5];
  }
}

/**
 * The most one line may ask for, in the product's OWN unit. One ceiling of
 * 100 used to apply to everything, which made grams unusable: a customer
 * could never order more than 100 g, and the 250 g / 500 g presets silently
 * became 100 g.
 *
 * @remarks
 * The ceiling is a guard against a slip of the finger, not a stock rule — the
 * shop decides what it can actually supply when it prices the list.
 *
 * It applies only to the picker. A customer typing a line by hand can write
 * whatever they like, because the paper takes free text.
 */
export function maxFor(unit?: string, unitValue?: number): number {
  if (isCountableUnit(unit, unitValue)) return 100; // 100 packs / pieces
  if (unit === "g" || unit === "ml") return 5000; // 5 kg / 5 litres, loose
  return 100; // kg, litre
}

/**
 * Rounds to two decimal places.
 *
 * @remarks
 * Stepping by 0.5 accumulates binary floating-point error, and "2.4000000001
 * kg" on a shop's order list reads as a bug. Two places is enough for every
 * unit in use.
 */
export function roundValue(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(roundValue(n));
}

/**
 * The final string stored on the draft row / sent to the shop.
 *
 * @remarks
 * The one place a quantity becomes words, so the shop always reads the same
 * shapes: `"2 × 10 kg"` for packs, `"3 pieces"` / `"1 dozen"` / `"2 packs"`
 * for counts, and `"2.5 kg"` for loose amounts. English plurals are written
 * out rather than translated, because this string is for the shopkeeper's
 * order list, not for the customer's screen.
 *
 * A countable product's value is rounded and floored at 1, so no line can ask
 * for half a piece or none at all.
 *
 * @returns Free text. Nothing parses it back — the one thing that reads a
 * quantity again is `addProduct`'s "+1" bump, and that deliberately only
 * touches a leading integer.
 */
export function buildQuantityString(
  unit: string | undefined,
  unitValue: number | undefined,
  value: number,
): string {
  if (isCountableUnit(unit, unitValue)) {
    const n = Math.max(1, Math.round(value));

    // Pre-packed size, e.g. a 10 kg bag ordered ×2  ->  "2 × 10 kg"
    if (typeof unitValue === "number" && unitValue !== 1 && unit) {
      return `${n} × ${unitValue} ${unit}`;
    }
    if (unit === "dozen") return `${n} dozen`;
    if (unit === "pack") return `${n} ${n > 1 ? "packs" : "pack"}`;
    return `${n} ${n > 1 ? "pieces" : "piece"}`; // piece / unknown
  }

  return `${fmtNum(value)} ${unit ?? ""}`.trim();
}
