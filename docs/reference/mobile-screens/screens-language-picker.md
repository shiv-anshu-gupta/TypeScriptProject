# LanguagePicker

The first-launch language choice.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/LanguagePicker.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`LanguagePicker`](#component-language-picker) | React component | `function LanguagePicker(props: { onSelect: () => void }): Element` | A full-screen choice between हिंदी and English, asked once before the app is used. |

## Exports in detail

### `LanguagePicker` {#component-language-picker}

*React component*

A full-screen choice between हिंदी and English, asked once before the app
is used.

```ts
function LanguagePicker(props: { onSelect: () => void }): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onSelect` | `() => void` | — |

**Returns** `Element`

Shown once, on the very first launch, before anything else. Bilingual on
purpose so a Hindi- or English-only user can both understand it.

Not a navigator screen. `App.tsx` renders it directly when no language has
been stored yet. Every string here is hard-coded in both languages rather
than translated, because this is the screen that decides which language the
rest of the app will use.

Choosing writes through `setAppLanguage`, which applies it and persists it,
before `onSelect` is called.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/LanguagePicker.tsx#L28)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/LanguagePicker.tsx)
