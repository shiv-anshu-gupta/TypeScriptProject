/**
 * Translates customer item names between Hindi and English, best-effort.
 *
 * @remarks
 * Backs the "Show हिंदी + English" toggle on each grocery-list card.
 *
 * Two limits to know before relying on this:
 *
 * - It calls a third-party Google endpoint directly from the browser, once per
 *   item name. Rate limiting, being offline, or a change at Google's end makes
 *   it fail, and every failure path returns the original text with no error
 *   shown. The toggle then quietly does nothing rather than reporting a
 *   problem.
 * - The cache is a module-level `Map`, so it is lost on every page reload.
 *
 * Neither the shopkeeper's typed prices nor the customer's original wording
 * depend on this succeeding. It is a reading aid only.
 *
 * @packageDocumentation
 */
// Generic, dictionary-free translation of arbitrary text (customer item names).
// Auto-detects the source language and translates to the target, so it works
// for ANY item — Hindi, English or Hinglish — not a fixed word list.
//
// Uses Google's free translate endpoint. It's an aid, not perfect: if a call
// fails (offline / rate-limited / CORS), we simply fall back to the original
// text, so the shopkeeper never loses the item the customer actually typed.

/**
 * The language to translate into.
 *
 * @remarks
 * The source language is always auto-detected, so the same call works for a
 * Hindi, English or Hinglish item name. The card requests both directions and
 * shows whichever differs from the original.
 */
export type TranslateTarget = "hi" | "en";

// Cache results so the same word is never translated twice (and the 15s admin
// poll doesn't re-hit the network).
const cache = new Map<string, string>();

/**
 * Translates one piece of text, returning the original if anything goes wrong.
 *
 * @remarks
 * Never rejects and never throws. A blank input, a non-OK response, a parse
 * failure or a network error all return `text` unchanged, so the shopkeeper
 * always keeps the words the customer actually typed.
 *
 * Results are cached under a lower-cased key, so the 15-second grocery-lists
 * poll does not re-issue a request for an item that is already on screen. Only
 * successful translations are cached; a failure will be retried next time.
 *
 * @param text - The item name as the customer wrote it.
 * @param target - Language to translate into. The source is auto-detected.
 * @returns The translated text, or `text` on any failure.
 */
export async function translateText(
  text: string,
  target: TranslateTarget,
): Promise<string> {
  const clean = text.trim();
  if (!clean) return text;

  const key = `${target}:${clean.toLowerCase()}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  try {
    const url =
      "https://translate.googleapis.com/translate_a/single" +
      `?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (!res.ok) return text;

    // Response shape: [[[ "translated", "original", ... ], ...], ...]
    const data = (await res.json()) as unknown;
    const segments =
      Array.isArray(data) && Array.isArray(data[0]) ? data[0] : [];
    const translated = segments
      .map((seg) => (Array.isArray(seg) ? String(seg[0] ?? "") : ""))
      .join("")
      .trim();

    const result = translated || text;
    cache.set(key, result);
    return result;
  } catch {
    return text; // offline / blocked → keep the original
  }
}

// Translate a whole list of item names in parallel (cached per word).
/**
 * Translates a whole list of item names at once.
 *
 * @remarks
 * Issues one request per uncached name, all in parallel. A twenty-item list
 * with the toggle switched on therefore makes up to twenty simultaneous calls
 * to the third-party endpoint — the most likely way to hit a rate limit.
 *
 * The returned array is index-aligned with `names`, which the card relies on to
 * pair each translation with its row. Because {@link translateText} never
 * rejects, the promise always resolves and the array is always complete, even
 * if some entries are untranslated originals.
 *
 * @param names - Item names in row order.
 * @param target - Language to translate into.
 * @returns Translations in the same order as `names`.
 */
export async function translateItems(
  names: string[],
  target: TranslateTarget,
): Promise<string[]> {
  return Promise.all(names.map((name) => translateText(name, target)));
}
