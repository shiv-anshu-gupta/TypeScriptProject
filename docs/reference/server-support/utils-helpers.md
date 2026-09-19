# Helpers `helpers`

Small guards that turn a missing or unusable value into an [`AppError`](utils-app-error.md#class-app-error), so a route can validate in one line and let the error middleware answer.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/helpers.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 3 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`requireFound`](#function-require-found) | Function | `function requireFound<T>(value: T \| null \| undefined, message: string, statusCode: number = 404): T` | Turns a lookup that may have found nothing into a value or a 404. |
| [`requireNumber`](#function-require-number) | Function | `function requireNumber(value: unknown, message: string, statusCode: number = 400): void` | Rejects a value that is already the `NaN` number. |
| [`requireText`](#function-require-text) | Function | `function requireText(value: unknown, message: string, statusCode: number = 400): void` | Rejects a value that is empty once coerced to a trimmed string. |

## Exports in detail

### `requireFound` {#function-require-found}

*Function*

Turns a lookup that may have found nothing into a value or a 404.

```ts
function requireFound<T>(value: T | null | undefined, message: string, statusCode: number = 404): T
```

| Parameter | Type | Meaning |
|---|---|---|
| `value` | `T \| null \| undefined` | — |
| `message` | `string` | — |
| `statusCode?` | `number` | Defaults to `404`. |

**Returns** `T` &mdash; The same value, typed as present.

**Throws**

- `AppError` with `statusCode` (404 by default) when the value is absent.

The usual way of dealing with a `findById` that can return `null`: the
result comes back with the null removed from its type, so the rest of the
handler can use it directly.

Any falsy value is treated as "not found", not just `null` - which is what
is wanted for documents, but means it must not be used on a number or
boolean that is legitimately `0` or `false`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/helpers.ts#L69)

### `requireNumber` {#function-require-number}

*Function*

Rejects a value that is already the `NaN` number.

```ts
function requireNumber(value: unknown, message: string, statusCode: number = 400): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `value` | `unknown` | — |
| `message` | `string` | sent to the caller verbatim. |
| `statusCode?` | `number` | Defaults to `400`. |

**Throws**

- `AppError` with `statusCode` when the value is `NaN`.

Note the narrowness: the check is `Number.isNaN(value)`, which is true only
for the actual `NaN` value. A string, `null`, `undefined` or an object all
pass, so this is not a "must be a number" guard - callers that need one
must convert first and check the result themselves.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/helpers.ts#L39)

### `requireText` {#function-require-text}

*Function*

Rejects a value that is empty once coerced to a trimmed string.

```ts
function requireText(value: unknown, message: string, statusCode: number = 400): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `value` | `unknown` | — |
| `message` | `string` | sent to the caller verbatim. |
| `statusCode?` | `number` | the status to answer with; 400 unless a route has a reason to use another. Defaults to `400`. |

**Throws**

- `AppError` with `statusCode` when the value is empty.

`null`, `undefined`, `0`, `false`, `""` and whitespace-only text all count
as missing, because the value is put through `String(value || "")` first.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/helpers.ts#L21)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/helpers.ts)
