# Grocery lists types `types`

The shapes behind the shop's daily screen: orders, their items, the chat, and the bodies of the endpoints that change them.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/grocery-lists/types.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 13 |

## Description

.

A "grocery list" is the order itself. A customer types items freely in the
mobile app — no product catalogue is involved — the shop prices them, and the
list moves through a one-way status flow to completion. The Product and Promo
pages in this panel play no part in that.

These types mirror the server's documents. Do not widen one without checking
the matching route, since the server validates independently.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AddGroceryListItemBody`](#type-add-grocery-list-item-body) | Type | `type AddGroceryListItemBody = { … };` | Body of `POST /admin/grocery-lists/:id/items` and of the item edit. |
| [`AdminConversation`](#type-admin-conversation) | Type | `type AdminConversation = { … };` | One customer conversation as shown on the Messages page. |
| [`AdminConversationsResponse`](#type-admin-conversations-response) | Type | `type AdminConversationsResponse = { … };` | Payload of `GET /admin/grocery-lists/conversations`. |
| [`AdminGroceryList`](#type-admin-grocery-list) | Type | `type AdminGroceryList = { … };` | A complete order, as the grocery-lists page works with it. |
| [`AdminGroceryListItem`](#type-admin-grocery-list-item) | Type | `type AdminGroceryListItem = { … };` | One line of an order. |
| [`AdminGroceryListsResponse`](#type-admin-grocery-lists-response) | Type | `type AdminGroceryListsResponse = { … };` | Payload of `GET /admin/grocery-lists` — and of every mutation on this page. |
| [`ChatMessage`](#type-chat-message) | Type | `type ChatMessage = { … };` | One chat message between the shop and the customer about an order. |
| [`ChatMessagesResponse`](#type-chat-messages-response) | Type | `type ChatMessagesResponse = { … };` | Payload of `GET /admin/grocery-lists/:id/messages`. |
| [`GroceryListPaymentMethod`](#type-grocery-list-payment-method) | Type | `type GroceryListPaymentMethod = "online" \| "upi" \| "at_shop";` | How the customer said they would pay. |
| [`GroceryListPaymentStatus`](#type-grocery-list-payment-status) | Type | `type GroceryListPaymentStatus = "pending" \| "paid";` | Whether the money has arrived. |
| [`GroceryListStatus`](#type-grocery-list-status) | Type | `type GroceryListStatus = "received" \| "priced" \| "packing" \| "packed" \| "ready" \| "completed" \| "cancelled";` | Where an order has got to. |
| [`SetGroceryListPricesBody`](#type-set-grocery-list-prices-body) | Type | `type SetGroceryListPricesBody = { … };` | Body of `PATCH /admin/grocery-lists/:id/prices`. |
| [`UpdateGroceryListStatusBody`](#type-update-grocery-list-status-body) | Type | `type UpdateGroceryListStatusBody = { … };` | Body of `PATCH /admin/grocery-lists/:id/status`. |

## Exports in detail

### `AddGroceryListItemBody` {#type-add-grocery-list-item-body}

*Type*

Body of `POST /admin/grocery-lists/:id/items` and of the item edit.

```ts
type AddGroceryListItemBody = {
  name: string;
  quantity: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `name` | `string` | — |
| `quantity` | `string` | — |

Both fields are stripped against a Unicode allowlist in the card before they
are sent. That allowlist deliberately includes combining marks so Devanagari
matras survive; removing them would corrupt Hindi item names. The server
applies the same rule, and requires a name of at least two characters.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L224)

### `AdminConversation` {#type-admin-conversation}

*Type*

One customer conversation as shown on the Messages page.

```ts
type AdminConversation = {
  listId: string;
  code: string;
  customerName: string;
  customerPhone: string;
  status: GroceryListStatus;
  messageCount: number;
  lastMessage: { text: string; sender: "customer" | "staff"; createdAt: string };
};
```

| Property | Type | Meaning |
|---|---|---|
| `code` | `string` | — |
| `customerName` | `string` | — |
| `customerPhone` | `string` | — |
| `lastMessage` | `{ text: string; sender: "customer" \| "staff"; createdAt: string }` | — |
| `listId` | `string` | — |
| `messageCount` | `number` | — |
| `status` | `GroceryListStatus` | — |

A summary row, not the thread: it carries only the last message, so the
Messages page can list every conversation from a single request. Opening a
row mounts the chat component, which fetches the full thread separately.

`sender` on the last message drives two pieces of the row — a `You:` prefix
when it was staff, and a "reply" pill when it was the customer and therefore
still needs an answer.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L102)

### `AdminConversationsResponse` {#type-admin-conversations-response}

*Type*

Payload of `GET /admin/grocery-lists/conversations`.

```ts
type AdminConversationsResponse = {
  conversations: AdminConversation[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `conversations` | `AdminConversation[]` | — |

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L117)

### `AdminGroceryList` {#type-admin-grocery-list}

*Type*

A complete order, as the grocery-lists page works with it.

```ts
type AdminGroceryList = {
  _id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: AdminGroceryListItem[];
  totalItems: number;
  totalAmount: number;
  status: GroceryListStatus;
  paymentMethod: GroceryListPaymentMethod;
  paymentStatus: GroceryListPaymentStatus;
  note: string;
  pricedAt?: string | null;
  packedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `code` | `string` | — |
| `completedAt?` | `string \| null` | — |
| `createdAt` | `string` | — |
| `customerEmail` | `string` | — |
| `customerName` | `string` | — |
| `customerPhone` | `string` | — |
| `items` | `AdminGroceryListItem[]` | — |
| `note` | `string` | — |
| `packedAt?` | `string \| null` | — |
| `paidAt?` | `string \| null` | — |
| `paymentMethod` | `GroceryListPaymentMethod` | — |
| `paymentStatus` | `GroceryListPaymentStatus` | — |
| `pricedAt?` | `string \| null` | — |
| `readyAt?` | `string \| null` | — |
| `status` | `GroceryListStatus` | — |
| `totalAmount` | `number` | — |
| `totalItems` | `number` | — |
| `updatedAt?` | `string \| null` | — |

`code` is the short human-readable order number shown to the customer and
used in the Share message; `_id` is the Mongo id used in every URL and as the
key for the pricing drafts and the packing checklist.

`totalAmount` is the server's figure. While the shopkeeper is typing, the
card shows the sum of the local drafts instead, so the two differ until
prices are saved. `totalAmount` greater than zero is also how the card
decides a list has been priced, which is what switches the primary button
from "Send prices to customer" to "Update prices".

The timestamps record when each stage was reached and are nullable because a
stage may not have happened. The card shows `updatedAt ?? createdAt`, and
adds a "first sent" line when the list was edited on a later day.

Note there is no field here for the packing checklist. That state exists only
in the shop device's `localStorage`. Moving it to the server would need a new
field on [`AdminGroceryListItem`](#type-admin-grocery-list-item).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L143)

### `AdminGroceryListItem` {#type-admin-grocery-list-item}

*Type*

One line of an order.

```ts
type AdminGroceryListItem = {
  name: string;
  quantity: string;
  rate?: number;
  price: number;
  available?: boolean;
};
```

| Property | Type | Meaning |
|---|---|---|
| `available?` | `boolean` | — |
| `name` | `string` | — |
| `price` | `number` | — |
| `quantity` | `string` | — |
| `rate?` | `number` | — |

`name` and `quantity` are the customer's own words, so `quantity` is free
text — "2 kg", "half dozen", "1 packet" — and is never parsed as a number for
storage. The pricing helper reads only a leading number from it, and treats
one as absent.

`rate` and `price` are separate on purpose: `rate` is what a unit costs and
`price` is what the line costs. Typing a rate fills the price in, but the
price can also be typed directly and then no longer matches rate times
quantity. `price` is what the customer is charged.

`rate` is optional in the type but is in practice always sent: saving prices
writes `0` for any line whose rate was never filled in, rather than omitting
the field.

`available` is also optional, and an absent value means available. When a
line is marked unavailable the server forces its `price` to 0 and pushes the
customer — but only on the way to unavailable, not on restore.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L82)

### `AdminGroceryListsResponse` {#type-admin-grocery-lists-response}

*Type*

Payload of `GET /admin/grocery-lists` — and of every mutation on this page.

```ts
type AdminGroceryListsResponse = {
  items: AdminGroceryList[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `AdminGroceryList[]` | — |

Each `PATCH` and `POST` here answers with the whole refreshed array rather
than the one record that changed. The hook therefore replaces its state
wholesale and never patches a row, which is why nothing on this page is
optimistic: the screen catches up only once the server has answered.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L174)

### `ChatMessage` {#type-chat-message}

*Type*

One chat message between the shop and the customer about an order.

```ts
type ChatMessage = {
  _id: string;
  sender: "customer" | "staff";
  senderName: string;
  text: string;
  createdAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `createdAt` | `string` | — |
| `sender` | `"customer" \| "staff"` | — |
| `senderName` | `string` | — |
| `text` | `string` | — |

`sender` decides the side and colour of the bubble. `senderName` is shown for
customer messages so staff can see who they are talking to.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L185)

### `ChatMessagesResponse` {#type-chat-messages-response}

*Type*

Payload of `GET /admin/grocery-lists/:id/messages`.

```ts
type ChatMessagesResponse = {
  messages: ChatMessage[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `messages` | `ChatMessage[]` | — |

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L194)

### `GroceryListPaymentMethod` {#type-grocery-list-payment-method}

*Type*

How the customer said they would pay.

```ts
type GroceryListPaymentMethod = "online" | "upi" | "at_shop";
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L48)

### `GroceryListPaymentStatus` {#type-grocery-list-payment-status}

*Type*

Whether the money has arrived.

```ts
type GroceryListPaymentStatus = "pending" | "paid";
```

Independent of [`GroceryListStatus`](#type-grocery-list-status): an order can be completed and still
unpaid, or paid while still being packed. The shop marks payment by hand,
usually after matching a UPI transfer with the page's amount matcher.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L58)

### `GroceryListStatus` {#type-grocery-list-status}

*Type*

Where an order has got to.

```ts
type GroceryListStatus = "received" | "priced" | "packing" | "packed" | "ready" | "completed" | "cancelled";
```

The flow runs one way and one step at a time:
`received → priced → packing → packed → ready → completed`. `cancelled` can
be entered from any open stage. `completed` and `cancelled` are terminal —
the card disables pricing, item editing and the flow buttons once either is
reached.

The card enforces "next step only": earlier steps render as ticks and later
steps are disabled. An earlier version used buttons that looked like toggles
and was misread, so do not restore free movement between statuses here.

`received` and `priced` are absent from
[`UpdateGroceryListStatusBody`](#type-update-grocery-list-status-body) because neither is set through the
status endpoint: `received` is the starting state, and `priced` is set as a
side effect of saving prices.

Each step sends the customer an Expo push from the server.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L38)

### `SetGroceryListPricesBody` {#type-set-grocery-list-prices-body}

*Type*

Body of `PATCH /admin/grocery-lists/:id/prices`.

```ts
type SetGroceryListPricesBody = {
  items: { price: number; rate?: number }[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `{ … }[]` | — |

The array is positional: entry `n` prices item `n`, so it must always be the
full list in order, never just the lines that changed.

Saving prices also hard-sets the status to `priced` on the server. Pressing
"Update prices" on a list that has already reached `packed` or `ready`
therefore drops it back to `priced`, resets the flow buttons, and sends the
customer a second "your list is priced" push. The button stays enabled at
those stages, so this is reachable by accident.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L211)

### `UpdateGroceryListStatusBody` {#type-update-grocery-list-status-body}

*Type*

Body of `PATCH /admin/grocery-lists/:id/status`.

```ts
type UpdateGroceryListStatusBody = {
  status: Exclude<GroceryListStatus, "received" | "priced">;
};
```

| Property | Type | Meaning |
|---|---|---|
| `status` | `Exclude<GroceryListStatus, "received" \| "priced">` | — |

`received` and `priced` are excluded because neither is reachable through
this endpoint. `received` is where a list starts, and `priced` is set as a
side effect of saving prices. So the type permits no way back to either, and
the only route to `priced` is through the prices endpoint.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts#L238)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/types.ts)
