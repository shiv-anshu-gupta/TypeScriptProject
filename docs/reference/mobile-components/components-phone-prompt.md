# PhonePrompt

The one-time sheet asking for the customer's mobile number.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/PhonePrompt.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PhonePrompt`](#component-phone-prompt) | React component | `function PhonePrompt(props: PhonePromptProps): Element` | A short sheet asking for a mobile number before the customer's first list goes to the shop. |

## Exports in detail

### `PhonePrompt` {#component-phone-prompt}

*React component*

A short sheet asking for a mobile number before the customer's first list
goes to the shop.

```ts
function PhonePrompt(props: PhonePromptProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onClose` | `() => void` | — |
| `onSubmit` | `(phone: string) => void` | Given the normalised 10-digit number, without the +91. |
| `open` | `boolean` | — |
| `submitting` | `boolean` | Drives both the spinner and the disabled state, so the number cannot be sent twice. |

**Returns** `Element`

Asked once, the first time a customer sends a list, so the shop can call them
about their order. Includes a short trust line explaining why.

It opens over the list sheet rather than replacing it, which the portal at
the app root makes possible. Controlled: it holds only the number being
typed, clears that each time it opens, and shows the validation message only
after the field has been left once, so it does not scold someone mid-type.

`onSubmit` receives a normalised number, never the raw text, so the caller
does not have to clean it up. Saving belongs to the send flow, not here.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/PhonePrompt.tsx#L42)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/PhonePrompt.tsx)
