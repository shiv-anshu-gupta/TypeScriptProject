// Generic, dictionary-free translation of arbitrary text (customer item names).
// Auto-detects the source language and translates to the target, so it works
// for ANY item — Hindi, English or Hinglish — not a fixed word list.
//
// Uses Google's free translate endpoint. It's an aid, not perfect: if a call
// fails (offline / rate-limited / CORS), we simply fall back to the original
// text, so the shopkeeper never loses the item the customer actually typed.

export type TranslateTarget = "hi" | "en";

// Cache results so the same word is never translated twice (and the 15s admin
// poll doesn't re-hit the network).
const cache = new Map<string, string>();

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
export async function translateItems(
  names: string[],
  target: TranslateTarget,
): Promise<string[]> {
  return Promise.all(names.map((name) => translateText(name, target)));
}
