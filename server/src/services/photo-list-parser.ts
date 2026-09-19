/**
 * Reads a photo of a handwritten grocery list and returns the items as text.
 *
 * @remarks
 * The photo is NEVER stored: its bytes arrive in the request, go straight to
 * the model, and are gone when the response is written. What the customer
 * keeps is the TEXT — written onto their list, where they can fix anything
 * the model misread before the shop ever sees it. That is the whole point:
 * the paper is only a way of typing quickly, so there is nothing to save.
 *
 * Provider: Google Gemini via the plain REST endpoint (free tier friendly,
 * no extra SDK). The whole provider surface is this one file, so swapping to
 * another model later touches nothing else.
 *
 * Configured by environment:
 *
 * ```
 * GEMINI_API_KEY  — required; without it every read answers 503
 * GEMINI_MODEL    — optional; overrides the default model
 * ```
 *
 * @packageDocumentation
 */
import { z } from "zod";
import { AppError } from "../utils/AppError";
import {
  cleanField,
  MAX_ITEMS_PER_SUBMIT,
  MAX_NAME_LEN,
  MAX_QTY_LEN,
  MIN_NAME_LEN,
} from "../utils/sanitizeItem";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.6-flash";

const MODEL_TIMEOUT_MS = 45_000;

// Guard rails for the free tier (~10-15 requests/minute), now that customers
// reach the model directly and not one shopkeeper at one desk:
//   - a per-customer gap, so a double tap or an impatient retry costs nothing
//   - a whole-server ceiling per minute, so a busy evening can't burn the
//     quota (or, later, the bill) in one go
// Both are best-effort: serverless runs several instances, each with its own
// memory, so treat these as a brake, never as a security boundary.
// Measured from the moment the previous read FINISHED - a read takes about
// ten seconds, so a gap timed from its start would already be over by the
// time the customer could tap again, and would brake nothing.
const USER_GAP_MS = 5_000;
const GLOBAL_LIMIT_PER_MIN = 12;
const readingNow = new Set<string>();
const finishedAtByUser = new Map<string, number>();
let windowStartedAt = 0;
let callsInWindow = 0;

/**
 * Drop callers we haven't seen for a while, so the map can't grow for ever.
 *
 * @remarks
 * Only does anything once the map passes 500 entries, so the common case
 * costs a size check. Entries older than a minute are past the per-customer
 * gap anyway, so forgetting them changes no decision.
 */
function forgetOldCallers(now: number) {
  if (finishedAtByUser.size < 500) return;
  for (const [key, at] of finishedAtByUser) {
    if (now - at > 60_000) finishedAtByUser.delete(key);
  }
}

/**
 * One item read off the paper.
 *
 * @remarks
 * `confidence` is the model's own estimate of how clearly the writing could
 * be read - `high` legible, `medium` fairly sure, `low` a guess at messy
 * handwriting. The app uses it to flag the rows the customer should check
 * before sending; nothing on the server treats a low-confidence row
 * differently.
 *
 * `name` and `quantity` have already been through the same sanitizer as
 * hand-typed items, so they are safe to store as they are.
 */
export type ParsedPhotoItem = {
  name: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
};

/**
 * The result of reading one customer's photographs.
 *
 * @remarks
 * `readable` false means no list could be made out at all - a blurred photo,
 * or a picture of something else - and `items` is then empty. It is not an
 * error: the customer is asked to retake the photo or type instead.
 */
export type ParsedPhotoList = {
  readable: boolean;
  items: ParsedPhotoItem[];
};

// What the model must return. Never trust model output: this is validated
// with zod AND each field is passed through the same sanitizer that guards
// hand-typed items before anything reaches the customer's list.
const modelOutputSchema = z.object({
  readable: z.boolean(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.string(),
        confidence: z.enum(["high", "medium", "low"]),
      }),
    )
    .max(200),
});

// Gemini's structured-output schema (OpenAPI subset, UPPERCASE types).
const responseSchema = {
  type: "OBJECT",
  properties: {
    readable: { type: "BOOLEAN" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          quantity: { type: "STRING" },
          confidence: { type: "STRING", enum: ["high", "medium", "low"] },
        },
        required: ["name", "quantity", "confidence"],
      },
    },
  },
  required: ["readable", "items"],
};

const SYSTEM_INSTRUCTION = [
  "You read photos of handwritten Indian grocery (kirana) lists.",
  "Lists mix Hindi (Devanagari), Hinglish and English, written quickly.",
  "Extract every distinct item exactly once.",
  "- name: the item as the customer wrote it (keep their script and wording,",
  "  e.g. 'आटा' stays 'आटा', 'surf chota' stays 'surf chota'). Fix only obvious",
  "  spelling slips. Never translate.",
  "- quantity: the amount if written ('2kg', '1 packet', '500g'), else ''.",
  "- confidence: 'high' if clearly legible, 'medium' if fairly sure,",
  "  'low' if you are guessing from messy writing.",
  "Never invent items that are not on the paper. Ignore prices, totals,",
  "phone numbers, doodles and anything that is not a grocery item.",
  "If no photo contains a readable list at all, return readable=false and an",
  "empty items array.",
].join("\n");

/**
 * The photo as it came off the phone. Held only for this one call.
 *
 * @remarks
 * `buffer` is the raw image bytes from the upload, base64-encoded inline into
 * the model request and never written anywhere. `mimeType` is passed to the
 * model as given.
 */
export type PhotoToRead = {
  mimeType: string;
  buffer: Buffer;
};

/**
 * Reads one customer's photographed list and returns the items as text.
 *
 * @remarks
 * One request carries every photo of the same list: the model sees them
 * together (a list can run onto a second page) and it costs one quota unit.
 *
 * This function is the admission control; the model call itself is
 * `readWithModel`. Three brakes are applied in order, all in this process's
 * memory and therefore best-effort only - several serverless instances each
 * keep their own counts, so treat them as a brake, never as a security
 * boundary:
 *
 * 1. one read at a time per customer;
 * 2. a five-second gap after a customer's previous read FINISHED;
 * 3. a whole-server ceiling of twelve reads a minute.
 *
 * Nothing is written to the database and no photo is kept. The model's text
 * is validated with zod and then put through the same allowlist sanitizer as
 * hand-typed items, so what comes back is safe to store.
 *
 * @param callerKey - identifies the customer for the per-customer brakes, so
 * one impatient person cannot lock out the rest of the shop's customers. Use
 * a stable id, not something the client chooses.
 * @returns At most {@link MAX_ITEMS_PER_SUBMIT} items. `readable` is only
 * true when the model said so AND at least one item survived cleaning.
 * @throws {@link AppError} 503 when the API key is unset, the model cannot be
 * reached or timed out (45s), the model is rate-limiting, or its output was
 * unusable. {@link AppError} 429 when this customer's own read is still
 * running or their gap has not elapsed. Every message is written for the
 * customer and suggests typing the items instead.
 */
export async function parseGroceryListPhotos(
  photosToRead: PhotoToRead[],
  callerKey: string,
): Promise<ParsedPhotoList> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "Reading photos isn't switched on yet. Please type the items instead.",
    );
  }

  const now = Date.now();

  if (readingNow.has(callerKey)) {
    throw new AppError(429, "Your photo is still being read — one moment.");
  }

  const finishedAt = finishedAtByUser.get(callerKey) ?? 0;
  if (now - finishedAt < USER_GAP_MS) {
    throw new AppError(429, "Just a moment before the next photo.");
  }

  if (now - windowStartedAt > 60_000) {
    windowStartedAt = now;
    callsInWindow = 0;
  }
  if (callsInWindow >= GLOBAL_LIMIT_PER_MIN) {
    throw new AppError(
      503,
      "A lot of lists are being read right now. Try again in a minute, or type the items.",
    );
  }
  callsInWindow += 1;
  readingNow.add(callerKey);

  try {
    return await readWithModel(photosToRead, apiKey);
  } finally {
    const doneAt = Date.now();
    readingNow.delete(callerKey);
    finishedAtByUser.set(callerKey, doneAt);
    forgetOldCallers(doneAt);
  }
}

/**
 * The call itself. Everything above is only about who may make it.
 *
 * @remarks
 * Posts the photos inline to Gemini's `generateContent` with a fixed system
 * instruction, `temperature: 0` and a structured-output schema, so the reply
 * is JSON of a known shape rather than prose. The whole call is abandoned
 * after 45 seconds.
 *
 * Failures are deliberately asymmetric: the customer gets one plain sentence,
 * while the real reason - HTTP status, Gemini's body, or unusable output - is
 * logged with a `[photo-parser]` prefix, truncated to 300 characters. A
 * successful read logs the model, photo count, item count and elapsed time.
 *
 * @throws {@link AppError} 503 for every failure mode; see
 * {@link parseGroceryListPhotos}.
 */
async function readWithModel(
  photosToRead: PhotoToRead[],
  apiKey: string,
): Promise<ParsedPhotoList> {
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const startedAt = Date.now();

  const photos = photosToRead.map((photo) => ({
    mimeType: photo.mimeType,
    data: photo.buffer.toString("base64"),
  }));

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [
          {
            role: "user",
            parts: [
              ...photos.map((photo) => ({
                inline_data: { mime_type: photo.mimeType, data: photo.data },
              })),
              {
                text: "Extract the grocery items from these photos of one customer's list.",
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0,
        },
      }),
    });
  } catch (error) {
    // The customer gets a plain sentence; the log keeps the real reason
    // (DNS, socket reset, our own 45s timeout), or we are left guessing.
    console.error(
      `[photo-parser] could not reach the model: ${(error as Error)?.message ?? error}`,
    );
    throw new AppError(
      503,
      "Could not reach the photo-reading service. Check the internet and try again.",
    );
  }

  if (response.status === 429) {
    throw new AppError(
      503,
      "The photo reader is busy right now. Try again in a minute, or type the items.",
    );
  }
  if (!response.ok) {
    console.error(
      `[photo-parser] Gemini error ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
    throw new AppError(
      503,
      "The photo could not be read just now. Try again, or type the items.",
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  let parsed: z.infer<typeof modelOutputSchema>;
  try {
    parsed = modelOutputSchema.parse(JSON.parse(rawText));
  } catch {
    console.error(
      `[photo-parser] unusable model output: ${rawText.slice(0, 300)}`,
    );
    throw new AppError(
      503,
      "The photo could not be read just now. Try again, or type the items.",
    );
  }

  // Same last line of defence as hand-typed items — the model's text goes
  // through the identical allowlist sanitizer before the list sees it.
  const items: ParsedPhotoItem[] = parsed.items
    .map((item) => ({
      name: cleanField(item.name, MAX_NAME_LEN, true),
      quantity: cleanField(item.quantity, MAX_QTY_LEN, true),
      confidence: item.confidence,
    }))
    .filter((item) => item.name.length >= MIN_NAME_LEN)
    .slice(0, MAX_ITEMS_PER_SUBMIT);

  console.log(
    `[photo-parser] model=${model} photos=${photos.length} items=${items.length} readable=${parsed.readable} ms=${Date.now() - startedAt}`,
  );

  return { readable: parsed.readable && items.length > 0, items };
}
