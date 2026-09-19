# Envelope `envelope`

The single JSON shape every endpoint answers with.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/envelope.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 3 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ApiEnvelope`](#type-api-envelope) | Type | `type ApiEnvelope<T> = { … };` | The response body shared by every endpoint, whether it succeeded or not. |
| [`fail`](#function-fail) | Function | `function fail(message: string, code?: string): ApiEnvelope<null>` | Builds a failure envelope. |
| [`ok`](#function-ok) | Function | `function ok<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T>` | Builds a success envelope. |

## Exports in detail

### `ApiEnvelope` {#type-api-envelope}

*Type*

The response body shared by every endpoint, whether it succeeded or not.

```ts
type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T | null;
  meta?: Record<string, unknown>;
  errors?: { message: string; code?: string }[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `data` | `T \| null` | — |
| `errors?` | `{ … }[]` | — |
| `meta?` | `Record<string, unknown>` | — |
| `status` | `"success" \| "error"` | — |

A client reads `status` first and never has to guess at the shape: on
success `data` holds the payload and `errors` is absent; on failure `data`
is null and `errors` carries at least one entry.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/envelope.ts#L15)

### `fail` {#function-fail}

*Function*

Builds a failure envelope.

```ts
function fail(message: string, code?: string): ApiEnvelope<null>
```

| Parameter | Type | Meaning |
|---|---|---|
| `message` | `string` | shown to the caller as written, so keep it plain and free of internal detail. |
| `code?` | `string` | short machine-readable tag for the client to branch on; the error middleware uses `APP_ERROR` for a thrown `AppError` and `INTERNAL` for anything unexpected. |

**Returns** `ApiEnvelope<null>`

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/envelope.ts#L41)

### `ok` {#function-ok}

*Function*

Builds a success envelope.

```ts
function ok<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T>
```

| Parameter | Type | Meaning |
|---|---|---|
| `data` | `T` | — |
| `meta?` | `Record<string, unknown>` | extras that sit beside the payload rather than inside it, such as a total count or a page limit. |

**Returns** `ApiEnvelope<T>`

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/envelope.ts#L28)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/envelope.ts)
