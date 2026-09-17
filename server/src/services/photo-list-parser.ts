import { z } from "zod";
import { AppError } from "../utils/AppError";
import {
  cleanField,
  MAX_ITEMS_PER_SUBMIT,
  MAX_NAME_LEN,
  MAX_QTY_LEN,
  MIN_NAME_LEN,
} from "../utils/sanitizeItem";

// Reads a customer's handwritten grocery-list photo(s) and returns the items
// as structured suggestions. The output is ALWAYS a draft the shopkeeper
// reviews and confirms in the admin panel — nothing here writes to the list.
//
// Provider: Google Gemini via the plain REST endpoint (free tier friendly,
// no extra SDK). The whole provider surface is this one file, so swapping to
// another model later touches nothing else.

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.6-flash";

// The shop's photos live on Cloudinary; refuse to fetch anything else even
// though the URLs come from our own database (defence in depth, not paranoia).
const PHOTO_HOST = "res.cloudinary.com";

const PHOTO_FETCH_TIMEOUT_MS = 20_000;
const MODEL_TIMEOUT_MS = 60_000;

// The free tier allows ~10-15 requests/minute. One admin clicking a button
// can't exceed that, but a stuck double-click or two open tabs could — a
// minimum gap between calls keeps the quota (and the bill, later) safe.
const MIN_GAP_MS = 4_000;
let lastCallAt = 0;

export type ParsedPhotoItem = {
  name: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
};

export type ParsedPhotoList = {
  readable: boolean;
  items: ParsedPhotoItem[];
};

export function isPhotoParserConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// What the model must return. Never trust model output: this is validated
// with zod AND each field is passed through the same sanitizer that guards
// hand-typed items before anything reaches the admin UI.
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
  "You read photos of handwritten Indian grocery (kirana) lists for a shopkeeper.",
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

async function fetchPhotoAsBase64(
  url: string,
): Promise<{ mimeType: string; data: string }> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== PHOTO_HOST) {
    throw new AppError(400, "Only photos stored by the app can be read");
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(PHOTO_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new AppError(
      502,
      "A photo could not be downloaded — it may have been deleted. Refresh and try again.",
    );
  }

  const mimeType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { mimeType, data: buffer.toString("base64") };
}

// One request carries ALL the photos of a list: the model sees them together
// (a list can continue across two photos) and it costs one quota unit.
export async function parseGroceryListPhotos(
  photoUrls: string[],
): Promise<ParsedPhotoList> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError(
      503,
      "Photo reading is not set up on the server (GEMINI_API_KEY missing). Add the items by hand.",
    );
  }

  const now = Date.now();
  if (now - lastCallAt < MIN_GAP_MS) {
    throw new AppError(429, "Please wait a few seconds and try again.");
  }
  lastCallAt = now;

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const startedAt = Date.now();

  const photos = await Promise.all(photoUrls.map(fetchPhotoAsBase64));

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
  } catch {
    throw new AppError(
      503,
      "Could not reach the photo-reading service. Check the internet and try again.",
    );
  }

  if (response.status === 429) {
    throw new AppError(
      503,
      "The photo reader is busy (free limit reached). Try again in a minute, or add the items by hand.",
    );
  }
  if (!response.ok) {
    console.error(
      `[photo-parser] Gemini error ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
    throw new AppError(
      503,
      "The photo reader had a problem. Try again, or add the items by hand.",
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
      "The photo reader returned an unusable answer. Try again, or add the items by hand.",
    );
  }

  // Same last line of defence as hand-typed items — the model's text goes
  // through the identical allowlist sanitizer before the admin UI sees it.
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
