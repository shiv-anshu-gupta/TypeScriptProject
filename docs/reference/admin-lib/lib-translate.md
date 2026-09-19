# Translate `translate`

Translates customer item names between Hindi and English, best-effort.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/translate.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 3 |

## Description

Backs the "Show हिंदी + English" toggle on each grocery-list card.

Two limits to know before relying on this:

- It calls a third-party Google endpoint directly from the browser, once per
  item name. Rate limiting, being offline, or a change at Google's end makes
  it fail, and every failure path returns the original text with no error
  shown. The toggle then quietly does nothing rather than reporting a
  problem.
- The cache is a module-level `Map`, so it is lost on every page reload.

Neither the shopkeeper's typed prices nor the customer's original wording
depend on this succeeding. It is a reading aid only.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`translateItems`](#function-translate-items) | Function | `function translateItems(names: string[], target: TranslateTarget): Promise<string[]>` | Translates a whole list of item names at once. |
| [`TranslateTarget`](#type-translate-target) | Type | `type TranslateTarget = "hi" \| "en";` | The language to translate into. |
| [`translateText`](#function-translate-text) | Function | `function translateText(text: string, target: TranslateTarget): Promise<string>` | Translates one piece of text, returning the original if anything goes wrong. |

## Exports in detail

### `translateItems` {#function-translate-items}

*Function*

Translates a whole list of item names at once.

```ts
function translateItems(names: string[], target: TranslateTarget): Promise<string[]>
```

| Parameter | Type | Meaning |
|---|---|---|
| `names` | `string[]` | Item names in row order. |
| `target` | `TranslateTarget` | Language to translate into. |

**Returns** `Promise<string[]>` &mdash; Translations in the same order as `names`.

Issues one request per uncached name, all in parallel. A twenty-item list
with the toggle switched on therefore makes up to twenty simultaneous calls
to the third-party endpoint — the most likely way to hit a rate limit.

The returned array is index-aligned with `names`, which the card relies on to
pair each translation with its row. Because [`translateText`](#function-translate-text) never
rejects, the promise always resolves and the array is always complete, even
if some entries are untranslated originals.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/translate.ts#L112)

### `TranslateTarget` {#type-translate-target}

*Type*

The language to translate into.

```ts
type TranslateTarget = "hi" | "en";
```

The source language is always auto-detected, so the same call works for a
Hindi, English or Hinglish item name. The card requests both directions and
shows whichever differs from the original.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/translate.ts#L37)

### `translateText` {#function-translate-text}

*Function*

Translates one piece of text, returning the original if anything goes wrong.

```ts
function translateText(text: string, target: TranslateTarget): Promise<string>
```

| Parameter | Type | Meaning |
|---|---|---|
| `text` | `string` | The item name as the customer wrote it. |
| `target` | `TranslateTarget` | Language to translate into. The source is auto-detected. |

**Returns** `Promise<string>` &mdash; The translated text, or `text` on any failure.

Never rejects and never throws. A blank input, a non-OK response, a parse
failure or a network error all return `text` unchanged, so the shopkeeper
always keeps the words the customer actually typed.

Results are cached under a lower-cased key, so the 15-second grocery-lists
poll does not re-issue a request for an item that is already on screen. Only
successful translations are cached; a failure will be retried next time.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/translate.ts#L59)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/translate.ts)
