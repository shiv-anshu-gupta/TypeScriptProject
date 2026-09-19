# PromoDialog `promo-dialog`

The create/edit promo dialog.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/promos/promo-dialog.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

One dialog serves both modes: it is in edit mode when a `promo` is passed and
in create mode when `promo` is `null`. The form is held in local component
state and every field is a string, matching `PromoFormValues`; the server
does the numeric parsing.

The dialog itself makes no API call — it hands the values to `onSaved`, which
the page wires to `savePromo` in `useAdminPromos`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PromoDialog`](#component-promo-dialog) | React component | `function PromoDialog(props: PromoDialogProps): Element` | Modal form for creating or editing one promo. |

## Exports in detail

### `PromoDialog` {#component-promo-dialog}

*React component · default export*

Modal form for creating or editing one promo.

```ts
function PromoDialog(props: PromoDialogProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onOpenChange` | `(open: boolean) => void` | — |
| `onSaved` | `(values: PromoFormValues) => Promise<void>` | Receives the cleaned values. The page routes this to `savePromo`, which POSTs or PATCHes and then closes the dialog. |
| `open` | `boolean` | — |
| `promo` | `Promo \| null` | The promo being edited, or `null` to create a new one. |
| `saving` | `boolean` | Whether a save is in flight; disables the submit button. |

**Returns** `Element` &mdash; The dialog.

The form lives only in this component's state. An effect reseeds it whenever
`open` or `promo` changes: closing resets to `defaultForm`, opening with
a `promo` copies its values in (numbers stringified, dates passed through
`toDateTimeLocal`), and opening without one shows a blank form. Nothing
typed here is kept once the dialog closes.

Validation is a presence check only: if any of the six fields is blank,
`submit` returns without calling `onSaved` and without showing a message, so
the button appears to do nothing. Beyond that the inputs only carry `min` and
`max` attributes; the server is the real validator.

On submit the code is trimmed and upper-cased, and both dates are converted
to ISO. A rejected save is caught and logged to the console — the dialog stays
open and shows no error of its own.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/promos/promo-dialog.tsx#L130)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/promos/promo-dialog.tsx)
