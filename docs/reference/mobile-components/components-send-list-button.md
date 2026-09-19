# SendListButton

The Send control for the draft list, in its two shapes.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/SendListButton.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`SendListButton`](#component-send-list-button) | React component | `function SendListButton(props: SendListButtonProps): Element` | The button that sends the customer's list to the shop, showing how many items are going and a spinner while it sends. |

## Exports in detail

### `SendListButton` {#component-send-list-button}

*React component*

The button that sends the customer's list to the shop, showing how many
items are going and a spinner while it sends.

```ts
function SendListButton(props: SendListButtonProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `variant` | `"pill" \| "block"` | "pill": the compact round button pinned in the list sheet's header, so Send is always on screen whatever the keyboard or scroll position. "block": the full-width button under the list on the Lists tab. |

**Returns** `Element`

The one Send control for the draft list. Both shapes run the same send flow
(validation, sign-in, first-time mobile number, submit) and own the phone
prompt that flow may open.

All of that lives in `useSendDraft`, not here: this component is the two
shapes plus a `Keyboard.dismiss()` so the customer can see it sending. It
always mounts [`PhonePrompt`](components-phone-prompt.md#component-phone-prompt), which opens as a second sheet over the
list sheet the first time a list is sent.

The flow can navigate away — signed out, it closes the sheet and opens the
sign-in screen — so a caller should not assume the button leaves the
customer where they were.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/SendListButton.tsx#L47)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/SendListButton.tsx)
