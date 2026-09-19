# shareList `share-list`

Turns a priced grocery list into a message the shop can send the customer.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/share-list.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 2 |

## Description

Backs the Share button in each grocery-list card's header. This is how the
shop sends a total to a customer outside the app — usually over WhatsApp.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`buildListShareText`](#function-build-list-share-text) | Function | `function buildListShareText(list: AdminGroceryList, itemNames?: string[]): string` | Formats an order as plain text: header, customer line, numbered items, total. |
| [`shareList`](#function-share-list) | Function | `function shareList(list: AdminGroceryList, itemNames?: string[]): Promise<void>` | Opens the device share sheet for an order, falling back to WhatsApp. |

## Exports in detail

### `buildListShareText` {#function-build-list-share-text}

*Function*

Formats an order as plain text: header, customer line, numbered items, total.

```ts
function buildListShareText(list: AdminGroceryList, itemNames?: string[]): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `list` | `AdminGroceryList` | The order to format. |
| `itemNames?` | `string[]` | Replacement names in row order, used when the card's Hindi and English toggle is on so the customer receives the translated wording. Index-aligned with `list.items`; a blank or missing entry falls back to the original name. |

**Returns** `string` &mdash; The message body.

Plain text with no markup, because the destination is a WhatsApp message
body.

Empty fields are omitted rather than shown blank: a line with no quantity
loses its separator, an unpriced line shows no price, and a list whose
`totalAmount` is zero gets no total line at all. Sharing an unpriced list is
therefore allowed and produces a plain shopping list.

Note that an item marked out of stock still appears here. The server forces
its price to zero, so it reads as a name with no price beside it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/share-list.ts#L38)

### `shareList` {#function-share-list}

*Function*

Opens the device share sheet for an order, falling back to WhatsApp.

```ts
function shareList(list: AdminGroceryList, itemNames?: string[]): Promise<void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `list` | `AdminGroceryList` | The order to share. |
| `itemNames?` | `string[]` | Optional translated names, as for [`buildListShareText`](#function-build-list-share-text). |

**Returns** `Promise<void>`

On a phone `navigator.share` gives the shopkeeper the OS share sheet, so the
message can go to WhatsApp, SMS or anything else installed. Desktop browsers
mostly lack it, so the fallback opens `wa.me` in a new tab with the text
pre-filled.

Neither path sends anything by itself, and neither confirms that anything was
sent. The shopkeeper still has to pick a recipient and press send. A
cancelled share sheet is swallowed on purpose — cancelling is not an error.

Note that no phone number is passed to `wa.me`, so the fallback cannot
pre-select the customer even though the list holds their number.

Resolves as soon as the sheet closes or the tab is opened. It does not wait
for, or report, delivery.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/share-list.ts#L92)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/share-list.ts)
