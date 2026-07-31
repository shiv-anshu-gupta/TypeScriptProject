// Turning a product's unit + a chosen amount into the free-text quantity the
// shop reads on the list. Two shapes:
//   • countable  — pieces / dozen / pack / a pre-packed size (e.g. a 10 kg bag):
//     the customer picks a whole count.  "2 × 10 kg", "3 pieces", "1 dozen".
//   • loose      — kg / g / litre / ml sold loose: the customer picks an amount.
//     "2.5 kg", "500 g".

export function isCountableUnit(unit?: string, unitValue?: number): boolean {
  // A packaged product (unitValue is a real pack size like 10) is always
  // counted in whole packs, whatever its base unit is.
  if (typeof unitValue === "number" && unitValue !== 1) return true;
  return unit === "piece" || unit === "dozen" || unit === "pack" || !unit;
}

export function defaultQuantityValue(unit?: string, unitValue?: number): number {
  if (isCountableUnit(unit, unitValue)) return 1;
  if (unit === "g" || unit === "ml") return 250;
  return 1; // kg, litre
}

export function stepFor(unit?: string): number {
  if (unit === "g" || unit === "ml") return 50;
  return 0.5; // kg, litre
}

export function minFor(unit?: string, unitValue?: number): number {
  if (isCountableUnit(unit, unitValue)) return 1;
  if (unit === "g" || unit === "ml") return 50;
  return 0.5;
}

// Quick-tap presets, expressed in the product's own unit so the resulting
// quantity string stays unambiguous.
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

export function roundValue(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(roundValue(n));
}

// The final string stored on the draft row / sent to the shop.
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
