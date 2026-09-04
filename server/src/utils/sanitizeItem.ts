import { AppError } from "./AppError";

// Hard limits for anything a customer / shopkeeper types into a grocery list.
// These are the LAST line of defence (the client also caps, but the client is
// never trusted). Kept deliberately generous for real groceries, tight enough
// that no single field or list can bloat / break the database.
export const MAX_NAME_LEN = 60; // "Aashirvaad Multigrain Atta 5kg" ~= 30
export const MAX_QTY_LEN = 12; // "2 packets", "500 g", "1 dozen"
// A real item name is never a single character ("Dal", "आटा", "Rice"...).
export const MIN_NAME_LEN = 2;
export const MAX_NOTE_LEN = 300;
export const MAX_ITEMS_PER_SUBMIT = 50; // one send
export const MAX_ITEMS_PER_LIST = 100; // a single list after merges / additions

// Drop control characters (incl. NUL / DEL) and zero-width / bidi "trick"
// characters that a malicious user could hide inside a field. Done by code
// point so the source itself carries no invisible characters.
function stripDangerousChars(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0) ?? 0;
    const isControl = c <= 0x1f || c === 0x7f; // C0 controls + DEL
    const isZeroWidthOrBidi =
      (c >= 0x200b && c <= 0x200f) || // zero-width space/joiner, LRM/RLM
      (c >= 0x202a && c <= 0x202e) || // bidi embeddings / overrides
      c === 0x2060 || // word joiner
      c === 0xfeff; // BOM / zero-width no-break space
    if (!isControl && !isZeroWidthOrBidi) out += ch;
  }
  return out;
}

// Allowlist for item name / quantity: keep only letters (ANY language, so
// English AND Hindi/Devanagari both work), digits, spaces, and the small set of
// punctuation real product names / quantities use: . , & ' - / ( ) %. Every
// other "special character" ($ { } < > " ; | = * \ ! @ # ? etc.) is removed.
// \p{M} (combining marks) is essential: Hindi vowel signs / matras are marks,
// not letters — dropping them would mangle Devanagari words (चावल -> चवल).
const DISALLOWED_SPECIALS = /[^\p{L}\p{M}\p{N}\s.,&'\-/()%]/gu;

function stripSpecialChars(s: string): string {
  return s.replace(DISALLOWED_SPECIALS, "");
}

// Coerce ANY value to a safe, bounded plain string.
//   - Only real primitives become text; objects / arrays (e.g. a `{ $gt: "" }`
//     injection payload) collapse to "" so they can never reach a query as an
//     operator, and never get stored as `[object Object]`.
//   - Strips control / zero-width / bidi characters.
//   - With `specialsOnly` on (item name / quantity), also removes every
//     special character outside the grocery allowlist.
//   - Collapses whitespace, trims, and hard-caps the length.
export function cleanField(
  value: unknown,
  maxLen: number,
  blockSpecials = false,
): string {
  let s: string;
  if (typeof value === "string") s = value;
  else if (typeof value === "number" || typeof value === "boolean")
    s = String(value);
  else s = ""; // object / array / null / undefined -> drop it

  s = stripDangerousChars(s);
  if (blockSpecials) s = stripSpecialChars(s);

  return s.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

// Clean + bound a whole incoming items array. Drops empty-name rows and rejects
// absurd payloads early (before any DB work).
export function cleanItems(
  raw: unknown,
): { name: string; quantity: string }[] {
  const arr = Array.isArray(raw) ? raw : [];

  // Reject a firehose of rows outright — don't even map 100k of them.
  if (arr.length > 500) {
    throw new AppError(400, "Too many items in one request");
  }

  const items = arr
    .map((entry) => {
      const obj = (entry ?? {}) as Record<string, unknown>;
      return {
        name: cleanField(obj.name, MAX_NAME_LEN, true),
        quantity: cleanField(obj.quantity, MAX_QTY_LEN, true),
      };
    })
    .filter((item) => item.name.length >= MIN_NAME_LEN);

  if (items.length > MAX_ITEMS_PER_SUBMIT) {
    throw new AppError(
      400,
      `A list can have at most ${MAX_ITEMS_PER_SUBMIT} items per send`,
    );
  }

  return items;
}
