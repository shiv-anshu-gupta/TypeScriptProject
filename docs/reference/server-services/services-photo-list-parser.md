# Photo list parser `photo-list-parser`

Reads a photo of a handwritten grocery list and returns the items as text.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/services/photo-list-parser.ts` |
| Group | [Server — services](index.md) |
| Exports | 4 |

## Description

The photo is NEVER stored: its bytes arrive in the request, go straight to
the model, and are gone when the response is written. What the customer
keeps is the TEXT — written onto their list, where they can fix anything
the model misread before the shop ever sees it. That is the whole point:
the paper is only a way of typing quickly, so there is nothing to save.

Provider: Google Gemini via the plain REST endpoint (free tier friendly,
no extra SDK). The whole provider surface is this one file, so swapping to
another model later touches nothing else.

Configured by environment:

```
GEMINI_API_KEY  — required; without it every read answers 503
GEMINI_MODEL    — optional; overrides the default model
```

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ParsedPhotoItem`](#type-parsed-photo-item) | Type | `type ParsedPhotoItem = { … };` | One item read off the paper. |
| [`ParsedPhotoList`](#type-parsed-photo-list) | Type | `type ParsedPhotoList = { … };` | The result of reading one customer's photographs. |
| [`parseGroceryListPhotos`](#function-parse-grocery-list-photos) | Function | `function parseGroceryListPhotos( … ): Promise<ParsedPhotoList>` | Reads one customer's photographed list and returns the items as text. |
| [`PhotoToRead`](#type-photo-to-read) | Type | `type PhotoToRead = { … };` | The photo as it came off the phone. |

## Exports in detail

### `ParsedPhotoItem` {#type-parsed-photo-item}

*Type*

One item read off the paper.

```ts
type ParsedPhotoItem = {
  name: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
};
```

| Property | Type | Meaning |
|---|---|---|
| `confidence` | `"high" \| "medium" \| "low"` | — |
| `name` | `string` | — |
| `quantity` | `string` | — |

`confidence` is the model's own estimate of how clearly the writing could
be read - `high` legible, `medium` fairly sure, `low` a guess at messy
handwriting. The app uses it to flag the rows the customer should check
before sending; nothing on the server treats a low-confidence row
differently.

`name` and `quantity` have already been through the same sanitizer as
hand-typed items, so they are safe to store as they are.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/services/photo-list-parser.ts#L84)

### `ParsedPhotoList` {#type-parsed-photo-list}

*Type*

The result of reading one customer's photographs.

```ts
type ParsedPhotoList = {
  readable: boolean;
  items: ParsedPhotoItem[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `ParsedPhotoItem[]` | — |
| `readable` | `boolean` | — |

`readable` false means no list could be made out at all - a blurred photo,
or a picture of something else - and `items` is then empty. It is not an
error: the customer is asked to retake the photo or type instead.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/services/photo-list-parser.ts#L98)

### `parseGroceryListPhotos` {#function-parse-grocery-list-photos}

*Function*

Reads one customer's photographed list and returns the items as text.

```ts
function parseGroceryListPhotos(
  photosToRead: PhotoToRead[],
  callerKey: string,
): Promise<ParsedPhotoList>
```

| Parameter | Type | Meaning |
|---|---|---|
| `photosToRead` | `PhotoToRead[]` | — |
| `callerKey` | `string` | identifies the customer for the per-customer brakes, so one impatient person cannot lock out the rest of the shop's customers. Use a stable id, not something the client chooses. |

**Returns** `Promise<ParsedPhotoList>` &mdash; At most [`MAX_ITEMS_PER_SUBMIT`](../server-support/utils-sanitize-item.md#constant-max-items-per-submit) items. `readable` is only true when the model said so AND at least one item survived cleaning.

**Throws**

- `AppError` 503 when the API key is unset, the model cannot be reached or timed out (45s), the model is rate-limiting, or its output was unusable. [`AppError`](../server-support/utils-app-error.md#class-app-error) 429 when this customer's own read is still running or their gap has not elapsed. Every message is written for the customer and suggests typing the items instead.

One request carries every photo of the same list: the model sees them
together (a list can run onto a second page) and it costs one quota unit.

This function is the admission control; the model call itself is
`readWithModel`. Three brakes are applied in order, all in this process's
memory and therefore best-effort only - several serverless instances each
keep their own counts, so treat them as a brake, never as a security
boundary:

1. one read at a time per customer;
2. a five-second gap after a customer's previous read FINISHED;
3. a whole-server ceiling of twelve reads a minute.

Nothing is written to the database and no photo is kept. The model's text
is validated with zod and then put through the same allowlist sanitizer as
hand-typed items, so what comes back is safe to store.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/services/photo-list-parser.ts#L201)

### `PhotoToRead` {#type-photo-to-read}

*Type*

The photo as it came off the phone. Held only for this one call.

```ts
type PhotoToRead = {
  mimeType: string;
  buffer: Buffer;
};
```

| Property | Type | Meaning |
|---|---|---|
| `buffer` | `Buffer` | — |
| `mimeType` | `string` | — |

`buffer` is the raw image bytes from the upload, base64-encoded inline into
the model request and never written anywhere. `mimeType` is passed to the
model as given.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/services/photo-list-parser.ts#L164)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/services/photo-list-parser.ts)
