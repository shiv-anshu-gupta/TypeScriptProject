/**
 * The last line of defence for anything typed into a grocery list.
 *
 * @remarks
 * Every piece of free text on its way to the database passes through here -
 * hand-typed items, the note, and the text a model read off a photograph
 * (services/photo-list-parser.ts uses the same {@link cleanField}). The
 * client caps and cleans too, but the client is never trusted.
 *
 * Two jobs: bound the size of everything, and reduce the character set to
 * what a real grocery list needs, so nothing typed into the app can become a
 * query operator, an invisible character, or a row that bloats the database.
 *
 * @packageDocumentation
 */
import { AppError } from "./AppError";

// Hard limits for anything a customer / shopkeeper types into a grocery list.
// These are the LAST line of defence (the client also caps, but the client is
// never trusted). Kept deliberately generous for real groceries, tight enough
// that no single field or list can bloat / break the database.
/** Longest an item name may be, in characters. */
export const MAX_NAME_LEN = 60; // "Aashirvaad Multigrain Atta 5kg" ~= 30
/** Longest a quantity may be, in characters. */
export const MAX_QTY_LEN = 12; // "2 packets", "500 g", "1 dozen"
/**
 * Shortest an item name may be. Anything cleaned down to fewer characters
 * than this is dropped rather than rejected - it is noise, not a mistake
 * worth telling the customer about.
 */
// A real item name is never a single character ("Dal", "आटा", "Rice"...).
export const MIN_NAME_LEN = 2;
/** Longest the free-text note on a list may be, in characters. */
export const MAX_NOTE_LEN = 300;
/**
 * Most items accepted in one send. Enforced by {@link cleanItems}, which
 * throws a 400 past it.
 */
export const MAX_ITEMS_PER_SUBMIT = 50; // one send
/**
 * Most items a single list may hold in total.
 *
 * @remarks
 * Not enforced here - a send is checked against
 * {@link MAX_ITEMS_PER_SUBMIT}, and this whole-list ceiling is applied by the
 * routes that add to an existing list: routes/customer/grocery-list.routes.ts
 * when the customer sends more, and routes/admin/grocery-list.routes.ts when
 * the shopkeeper adds a row.
 */
export const MAX_ITEMS_PER_LIST = 100; // a single list after merges / additions

/**
 * Drop control characters (incl. NUL / DEL) and zero-width / bidi "trick"
 * characters that a malicious user could hide inside a field. Done by code
 * point so the source itself carries no invisible characters.
 *
 * @remarks
 * These are the characters that make two different strings look identical to
 * a shopkeeper reading an order, or reverse the direction of what is
 * displayed. Applied to every field, including the note.
 */
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
// The multiplication sign is allowed too: the app writes pack quantities as
// "2 × 10 kg", and stripping it left the shop reading "2 10 kg".
// \p{M} (combining marks) is essential: Hindi vowel signs / matras are marks,
// not letters — dropping them would mangle Devanagari words (चावल -> चवल).
const DISALLOWED_SPECIALS = /[^\p{L}\p{M}\p{N}\s.,&'\-/()%×]/gu;

/** Applies the grocery allowlist above, removing everything outside it. */
function stripSpecialChars(s: string): string {
  return s.replace(DISALLOWED_SPECIALS, "");
}

/**
 * Coerce ANY value to a safe, bounded plain string.
 *
 * @remarks
 * - Only real primitives become text; objects / arrays (e.g. a `{ $gt: "" }`
 *   injection payload) collapse to "" so they can never reach a query as an
 *   operator, and never get stored as `[object Object]`.
 * - Strips control / zero-width / bidi characters.
 * - With `specialsOnly` on (item name / quantity), also removes every
 *   special character outside the grocery allowlist.
 * - Collapses whitespace, trims, and hard-caps the length.
 *
 * Nothing is ever rejected: bad input becomes a shorter string, or an empty
 * one. Callers decide what an empty result means.
 *
 * @param maxLen - the result is cut to this many characters. Pass the
 * matching constant from this file rather than a literal.
 * @param blockSpecials - on for an item name or quantity, off for free prose
 * such as the note, which would otherwise lose its punctuation.
 * @returns Cleaned text, possibly `""`. Never null or undefined.
 */
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

/**
 * Clean + bound a whole incoming items array. Drops empty-name rows and rejects
 * absurd payloads early (before any DB work).
 *
 * @remarks
 * Order matters here. A payload of more than 500 rows is refused before
 * anything is mapped, so a firehose costs nothing; then each row is cleaned;
 * then rows whose name did not survive to {@link MIN_NAME_LEN} are dropped;
 * and only what is left is measured against {@link MAX_ITEMS_PER_SUBMIT}. So
 * a list padded with junk rows is not punished for them.
 *
 * Anything that is not an array - including `null` and an object - is treated
 * as an empty list rather than an error.
 *
 * Only `name` and `quantity` survive; any other field on an incoming row is
 * discarded, so a client cannot post its own price.
 *
 * @param raw - the request body's items, entirely untrusted.
 * @returns Cleaned rows, at most {@link MAX_ITEMS_PER_SUBMIT} of them.
 * @throws {@link AppError} 400 when more than 500 rows arrive, or when more
 * than {@link MAX_ITEMS_PER_SUBMIT} survive cleaning.
 */
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
