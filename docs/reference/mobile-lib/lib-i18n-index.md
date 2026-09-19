# I18n index `index`

i18next, configured for this app, plus the two helpers that make the customer's choice of language survive a restart.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/i18n/index.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 5 |

## Description

Importing this module initialises i18next as a side effect, which is why it
is imported at the root of the app before any screen renders. Its default
export is the initialised instance: use `useTranslation()` inside a
component, and `i18n.t(...)` from a store or any other non-React code.

English is the source of truth. `Translations` is derived from the English
object, so a key added to `en.ts` and not to `hi.ts` is a TypeScript error,
and so is a stray key in `hi.ts`. `npx tsc --noEmit` is what catches it —
there is no lint rule and no test.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AppLanguage`](#type-app-language) | Type | `type AppLanguage = "en" \| "hi";` | The languages the app ships with. |
| [`getStoredLanguage`](#function-get-stored-language) | Function | `function getStoredLanguage(): Promise<AppLanguage \| null>` | Reads back the customer's saved choice. |
| [`i18n`](#re-export-i18n) | Re-export | `export { i18n }; // declared in i18next` | — |
| [`LANGUAGE_KEY`](#constant-language-key) | Constant | `const LANGUAGE_KEY: "app_language"` | AsyncStorage key holding the customer's chosen language. |
| [`setAppLanguage`](#function-set-app-language) | Function | `function setAppLanguage(lang: AppLanguage): Promise<void>` | Switches the app's language and remembers the choice. |

## Exports in detail

### `AppLanguage` {#type-app-language}

*Type*

The languages the app ships with.

```ts
type AppLanguage = "en" | "hi";
```

Adding one means a third resource file mirroring `en.ts`, an entry in
`resources` below, and a third button on the first-launch picker.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/index.ts#L42)

### `getStoredLanguage` {#function-get-stored-language}

*Function*

Reads back the customer's saved choice.

```ts
function getStoredLanguage(): Promise<AppLanguage | null>
```

**Returns** `Promise<AppLanguage \| null>` &mdash; The saved language, or `null` when there is none, which the app root treats as a first launch and answers with the language picker.

Anything unrecognised — a storage failure, or a language written by an
older build that no longer exists — reads as `null`. Never throws.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/index.ts#L68)

### `i18n` {#re-export-i18n}

*Re-export · default export · re-exported from `i18next`*

```ts
export { i18n }; // declared in i18next
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/index.ts)

### `LANGUAGE_KEY` {#constant-language-key}

*Constant*

AsyncStorage key holding the customer's chosen language.

```ts
const LANGUAGE_KEY: "app_language"
```

Its absence is what makes a launch the *first* launch: the app shows the
language picker when nothing is stored here. Clearing it therefore brings
the picker back.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/index.ts#L34)

### `setAppLanguage` {#function-set-app-language}

*Function*

Switches the app's language and remembers the choice.

```ts
function setAppLanguage(lang: AppLanguage): Promise<void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `lang` | `AppLanguage` | — |

**Returns** `Promise<void>`

The one way to change language: it writes the choice and switches i18next,
so no caller has to do both. Used by the first-launch picker and by the
language row on the Account screen.

A storage failure is swallowed — the switch still happens for this session,
it just will not be remembered. The i18next change is awaited, so once this
resolves every mounted screen has re-rendered in the new language.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/index.ts#L89)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/index.ts)
