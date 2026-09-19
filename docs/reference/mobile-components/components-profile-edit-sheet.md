# ProfileEditSheet

The sheet for editing the name and number the shop sees.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ProfileEditSheet.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProfileEditSheet`](#component-profile-edit-sheet) | React component | `function ProfileEditSheet(props: ProfileEditSheetProps): Element` | A short sheet with a name field and a mobile field, saving what the shop will see on this customer's orders. |

## Exports in detail

### `ProfileEditSheet` {#component-profile-edit-sheet}

*React component*

A short sheet with a name field and a mobile field, saving what the shop
will see on this customer's orders.

```ts
function ProfileEditSheet(props: ProfileEditSheetProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `initialName` | `string` | — |
| `initialPhone` | `string` | — |
| `onClose` | `() => void` | — |
| `onSubmit` | `(values: { name: string; phone?: string }) => void` | Given a trimmed name and a normalised phone. `phone` is left out when the customer hasn't given one - the server rejects an empty number, and the name alone is a valid save. |
| `open` | `boolean` | — |
| `submitting` | `boolean` | — |

**Returns** `Element`

Lets the customer correct the name and mobile the SHOP sees on their orders.
Opened from the "Edit" button on the Account screen.

Controlled by its caller and re-seeded from the current values every time it
opens, so an abandoned edit is never carried into the next one. It saves
nothing itself — the Account screen owns the request and the store.

The name is required; the mobile is optional and only has to be valid if
something was typed, so a customer who has not given a number can still fix
their name. Names pass through `stripSpecials`, the same cleaning the list
lines get.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ProfileEditSheet.tsx#L46)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ProfileEditSheet.tsx)
