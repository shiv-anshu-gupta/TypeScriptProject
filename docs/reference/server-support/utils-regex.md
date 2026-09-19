# escapeRegex `regex`

Escaping for text that will be used as a pattern.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/regex.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`escapeRegex`](#function-escape-regex) | Function | `function escapeRegex(input: string): string` | Make user-typed text safe to use inside a MongoDB `$regex`. |

## Exports in detail

### `escapeRegex` {#function-escape-regex}

*Function*

Make user-typed text safe to use inside a MongoDB `$regex`.

```ts
function escapeRegex(input: string): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `input` | `string` | — |

**Returns** `string` &mdash; The input with each metacharacter backslash-escaped.

A search box is free text: "(", "*", "+" or "?" make an invalid regular
expression (the query throws and the customer sees "no products"), and a
crafted one can be made slow on purpose.

Every regex metacharacter is escaped, so the result matches the typed text
literally. Used by the product search in both the admin and customer
product routes.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/regex.ts#L21)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/regex.ts)
