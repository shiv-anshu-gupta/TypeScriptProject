# Sanitize Item `sanitizeItem`

The last line of defence for anything typed into a grocery list.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/sanitizeItem.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 8 |

## Description

Every piece of free text on its way to the database passes through here -
hand-typed items, the note, and the text a model read off a photograph
(services/photo-list-parser.ts uses the same [`cleanField`](#function-clean-field)). The
client caps and cleans too, but the client is never trusted.

Two jobs: bound the size of everything, and reduce the character set to
what a real grocery list needs, so nothing typed into the app can become a
query operator, an invisible character, or a row that bloats the database.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`cleanField`](#function-clean-field) | Function | `function cleanField(value: unknown, maxLen: number, blockSpecials: boolean = false): string` | Coerce ANY value to a safe, bounded plain string. |
| [`cleanItems`](#function-clean-items) | Function | `function cleanItems(raw: unknown): { name: string; quantity: string }[]` | Clean + bound a whole incoming items array. |
| [`MAX_ITEMS_PER_LIST`](#constant-max-items-per-list) | Constant | `const MAX_ITEMS_PER_LIST: 100` | Most items a single list may hold in total. |
| [`MAX_ITEMS_PER_SUBMIT`](#constant-max-items-per-submit) | Constant | `const MAX_ITEMS_PER_SUBMIT: 50` | Most items accepted in one send. |
| [`MAX_NAME_LEN`](#constant-max-name-len) | Constant | `const MAX_NAME_LEN: 60` | Longest an item name may be, in characters. |
| [`MAX_NOTE_LEN`](#constant-max-note-len) | Constant | `const MAX_NOTE_LEN: 300` | Longest the free-text note on a list may be, in characters. |
| [`MAX_QTY_LEN`](#constant-max-qty-len) | Constant | `const MAX_QTY_LEN: 12` | Longest a quantity may be, in characters. |
| [`MIN_NAME_LEN`](#constant-min-name-len) | Constant | `const MIN_NAME_LEN: 2` | Shortest an item name may be. |

## Exports in detail

### `cleanField` {#function-clean-field}

*Function*

Coerce ANY value to a safe, bounded plain string.

```ts
function cleanField(value: unknown, maxLen: number, blockSpecials: boolean = false): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `value` | `unknown` | — |
| `maxLen` | `number` | the result is cut to this many characters. Pass the matching constant from this file rather than a literal. |
| `blockSpecials?` | `boolean` | on for an item name or quantity, off for free prose such as the note, which would otherwise lose its punctuation. Defaults to `false`. |

**Returns** `string` &mdash; Cleaned text, possibly `""`. Never null or undefined.

- Only real primitives become text; objects / arrays (e.g. a `{ $gt: "" }`
  injection payload) collapse to "" so they can never reach a query as an
  operator, and never get stored as `[object Object]`.
- Strips control / zero-width / bidi characters.
- With `specialsOnly` on (item name / quantity), also removes every
  special character outside the grocery allowlist.
- Collapses whitespace, trims, and hard-caps the length.

Nothing is ever rejected: bad input becomes a shorter string, or an empty
one. Callers decide what an empty result means.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L113)

### `cleanItems` {#function-clean-items}

*Function*

Clean + bound a whole incoming items array. Drops empty-name rows and rejects
absurd payloads early (before any DB work).

```ts
function cleanItems(raw: unknown): { name: string; quantity: string }[]
```

| Parameter | Type | Meaning |
|---|---|---|
| `raw` | `unknown` | the request body's items, entirely untrusted. |

**Returns** `{ … }[]` &mdash; Cleaned rows, at most [`MAX_ITEMS_PER_SUBMIT`](#constant-max-items-per-submit) of them.

**Throws**

- `AppError` 400 when more than 500 rows arrive, or when more than [`MAX_ITEMS_PER_SUBMIT`](#constant-max-items-per-submit) survive cleaning.

Order matters here. A payload of more than 500 rows is refused before
anything is mapped, so a firehose costs nothing; then each row is cleaned;
then rows whose name did not survive to [`MIN_NAME_LEN`](#constant-min-name-len) are dropped;
and only what is left is measured against [`MAX_ITEMS_PER_SUBMIT`](#constant-max-items-per-submit). So
a list padded with junk rows is not punished for them.

Anything that is not an array - including `null` and an object - is treated
as an empty list rather than an error.

Only `name` and `quantity` survive; any other field on an incoming row is
discarded, so a client cannot post its own price.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L152)

### `MAX_ITEMS_PER_LIST` {#constant-max-items-per-list}

*Constant*

Most items a single list may hold in total.

```ts
const MAX_ITEMS_PER_LIST: 100
```

Not enforced here - a send is checked against
[`MAX_ITEMS_PER_SUBMIT`](#constant-max-items-per-submit), and this whole-list ceiling is applied by the
routes that add to an existing list: routes/customer/grocery-list.routes.ts
when the customer sends more, and routes/admin/grocery-list.routes.ts when
the shopkeeper adds a row.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L50)

### `MAX_ITEMS_PER_SUBMIT` {#constant-max-items-per-submit}

*Constant*

Most items accepted in one send. Enforced by [`cleanItems`](#function-clean-items), which
throws a 400 past it.

```ts
const MAX_ITEMS_PER_SUBMIT: 50
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L39)

### `MAX_NAME_LEN` {#constant-max-name-len}

*Constant*

Longest an item name may be, in characters.

```ts
const MAX_NAME_LEN: 60
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L23)

### `MAX_NOTE_LEN` {#constant-max-note-len}

*Constant*

Longest the free-text note on a list may be, in characters.

```ts
const MAX_NOTE_LEN: 300
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L34)

### `MAX_QTY_LEN` {#constant-max-qty-len}

*Constant*

Longest a quantity may be, in characters.

```ts
const MAX_QTY_LEN: 12
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L25)

### `MIN_NAME_LEN` {#constant-min-name-len}

*Constant*

Shortest an item name may be. Anything cleaned down to fewer characters
than this is dropped rather than rejected - it is noise, not a mistake
worth telling the customer about.

```ts
const MIN_NAME_LEN: 2
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts#L32)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/sanitizeItem.ts)
