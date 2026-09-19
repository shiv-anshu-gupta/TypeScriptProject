# hi

The Hindi half of the app's strings.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/i18n/hi.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 1 |

## Description

This is the app's default language, not a fallback: Hindi is what a phone
shows until the customer chooses otherwise.

Some words stay in English on purpose, because that is what customers say:
Play Store, UPI, the app's own name.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`hi`](#constant-hi) | Constant | `const hi: Translations` | Every string the app can show, in Hindi. |

## Exports in detail

### `hi` {#constant-hi}

*Constant*

Every string the app can show, in Hindi.

```ts
const hi: Translations
```

Hindi strings — simple, everyday Hindi for non-English-speaking customers.
Keys must match en.ts exactly.

The `Translations` annotation is what enforces the mirror — leave it in
place. Without it a missing key would quietly fall back to English at
runtime with nothing to warn anybody.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/hi.ts#L26)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/i18n/hi.ts)
