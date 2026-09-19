# Grocery list types `types`

The shapes of a sent list, its chat, and what comes back from reading a photo.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/grocery-list/types.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 13 |

## Description

These mirror the server's documents, so `_id` and ISO date strings appear
as the server sends them rather than being mapped on the way in.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ACTIVE_STATUSES`](#constant-active-statuses) | Constant | `const ACTIVE_STATUSES: readonly ["received", "priced", "packing", "packed", "ready"]` | The statuses an order passes through while it is still in progress, in order. |
| [`ChatMessage`](#type-chat-message) | Type | `type ChatMessage = { … };` | Chat: one message on an order's conversation. |
| [`ChatMessagesResponse`](#type-chat-messages-response) | Type | `type ChatMessagesResponse = { … };` | The body of the messages endpoint. |
| [`CustomerGroceryList`](#type-customer-grocery-list) | Type | `type CustomerGroceryList = { … };` | One order, as the customer sees it. |
| [`CustomerGroceryListsResponse`](#type-customer-grocery-lists-response) | Type | `type CustomerGroceryListsResponse = { … };` | The body of `GET /customer/grocery-lists`. |
| [`GroceryListItem`](#type-grocery-list-item) | Type | `type GroceryListItem = { … };` | One line of a sent list. |
| [`GroceryListPaymentMethod`](#type-grocery-list-payment-method) | Type | `type GroceryListPaymentMethod = "online" \| "upi" \| "at_shop";` | How the customer said they would pay. |
| [`GroceryListPaymentStatus`](#type-grocery-list-payment-status) | Type | `type GroceryListPaymentStatus = "pending" \| "paid";` | Whether the shop has the money. |
| [`GroceryListStatus`](#type-grocery-list-status) | Type | `type GroceryListStatus = "received" \| "priced" \| "packing" \| "packed" \| "ready" \| "completed" \| "cancelled";` | Every status an order can hold. |
| [`ReadPhotoResponse`](#type-read-photo-response) | Type | `type ReadPhotoResponse = { … };` | The body of the read-photo endpoint. |
| [`ScannedItem`](#type-scanned-item) | Type | `type ScannedItem = { … };` | One item read off a photo of a handwritten list. |
| [`ShopUpi`](#type-shop-upi) | Type | `type ShopUpi = { … };` | Where a UPI payment goes. |
| [`SubmitGroceryListBody`](#type-submit-grocery-list-body) | Type | `type SubmitGroceryListBody = { … };` | What is sent to the shop. |

## Exports in detail

### `ACTIVE_STATUSES` {#constant-active-statuses}

*Constant*

The statuses an order passes through while it is still in progress, in
order. Used by the Home journey card, the Lists "Active" tab and the
timeline, so they can never disagree about what counts as active.

```ts
const ACTIVE_STATUSES: readonly ["received", "priced", "packing", "packed", "ready"]
```

The order is the timeline's order, so it can be rendered by iterating this
rather than by listing the steps again.

`completed` and `cancelled` are deliberately absent: an order that has
reached either is finished and is not tracked.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L24)

### `ChatMessage` {#type-chat-message}

*Type*

Chat: one message on an order's conversation.

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

`sender` says which side of the sheet it is drawn on. `senderName` is who
at the shop wrote it, which matters when more than one person answers.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L206)

### `ChatMessagesResponse` {#type-chat-messages-response}

*Type*

The body of the messages endpoint.

```ts
type ChatMessagesResponse = {
  messages: ChatMessage[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `messages` | `ChatMessage[]` | — |

The whole conversation each time, oldest first — there is no paging, since
one order's chat is short.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L221)

### `CustomerGroceryList` {#type-customer-grocery-list}

*Type*

One order, as the customer sees it.

```ts
type CustomerGroceryList = {
  _id: string;
  code: string;
  items: GroceryListItem[];
  totalItems: number;
  totalAmount: number;
  status: GroceryListStatus;
  paymentMethod: GroceryListPaymentMethod;
  paymentStatus: GroceryListPaymentStatus;
  seenByCustomer: boolean;
  note: string;
  pricedAt?: string | null;
  packedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `code` | `string` | — |
| `completedAt?` | `string \| null` | — |
| `createdAt` | `string` | — |
| `items` | `GroceryListItem[]` | — |
| `note` | `string` | — |
| `packedAt?` | `string \| null` | — |
| `paidAt?` | `string \| null` | — |
| `paymentMethod` | `GroceryListPaymentMethod` | — |
| `paymentStatus` | `GroceryListPaymentStatus` | — |
| `pricedAt?` | `string \| null` | — |
| `readyAt?` | `string \| null` | — |
| `seenByCustomer` | `boolean` | — |
| `status` | `GroceryListStatus` | — |
| `totalAmount` | `number` | — |
| `totalItems` | `number` | — |

`code` is the short human reference the customer and shopkeeper say aloud;
`_id` is what the API takes. They are not interchangeable.

`totalAmount` is 0 until the shop prices the list, so the pay buttons check
the status rather than the amount.

`seenByCustomer` drives the "new update" badge and is cleared by a PATCH,
not by rendering.

The `…At` timestamps are set as the order passes each stage and stay unset
before it, which is how the timeline knows how far it has got.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L102)

### `CustomerGroceryListsResponse` {#type-customer-grocery-lists-response}

*Type*

The body of `GET /customer/grocery-lists`.

```ts
type CustomerGroceryListsResponse = {
  items: CustomerGroceryList[];
  unseenCount: number;
  upi: ShopUpi;
  customerPhone: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `customerPhone` | `string` | — |
| `items` | `CustomerGroceryList[]` | — |
| `unseenCount` | `number` | — |
| `upi` | `ShopUpi` | — |

Deliberately more than the lists: one request answers the badge, the pay
button and the send flow's "do we know this customer's number" question.

`customerPhone` is `""` when there is none on file.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L143)

### `GroceryListItem` {#type-grocery-list-item}

*Type*

One line of a sent list.

```ts
type GroceryListItem = {
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

`quantity` is the free text the customer wrote — it is read, not parsed.

`rate` and `price` are filled in by the shop when it prices the list, so
before that they are absent or zero and must not be shown as a real price.
`available` is the shop saying it could not supply this line.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L78)

### `GroceryListPaymentMethod` {#type-grocery-list-payment-method}

*Type*

How the customer said they would pay.

```ts
type GroceryListPaymentMethod = "online" | "upi" | "at_shop";
```

`online` is a leftover from the gateway this app no longer has; live orders
are `upi` or `at_shop`. It is what the customer intends, not proof of
anything — [`GroceryListPaymentStatus`](#type-grocery-list-payment-status) is what says whether money
arrived.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L57)

### `GroceryListPaymentStatus` {#type-grocery-list-payment-status}

*Type*

Whether the shop has the money.

```ts
type GroceryListPaymentStatus = "pending" | "paid";
```

Only the shopkeeper sets this, by hand, once the payment lands in their own
UPI app or at the counter. The UPI deep link has no callback, so nothing in
this app can move it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L66)

### `GroceryListStatus` {#type-grocery-list-status}

*Type*

Every status an order can hold.

```ts
type GroceryListStatus = "received" | "priced" | "packing" | "packed" | "ready" | "completed" | "cancelled";
```

The shop moves it forward from the admin panel; the app only reads it. The
customer's own actions — paying, removing an item — do not change it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L39)

### `ReadPhotoResponse` {#type-read-photo-response}

*Type*

The body of the read-photo endpoint.

```ts
type ReadPhotoResponse = {
  readable: boolean;
  items: ScannedItem[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `ScannedItem[]` | — |
| `readable` | `boolean` | — |

`readable` false is a normal answer, not an error: the request succeeded
and there was simply no list in the picture. Check it before looking at
`items`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L174)

### `ScannedItem` {#type-scanned-item}

*Type*

One item read off a photo of a handwritten list. It is a SUGGESTION: it
lands on the customer's own list, in an editable line, so they can correct
anything the reader misheard before the shop sees it.

```ts
type ScannedItem = {
  name: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
};
```

| Property | Type | Meaning |
|---|---|---|
| `confidence` | `"high" \| "medium" \| "low"` | — |
| `name` | `string` | — |
| `quantity` | `string` | — |

`confidence` is the reader's own opinion. Nothing filters on it at present;
every line reaches the paper, because the customer is a better judge of
their own handwriting than the model is.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L160)

### `ShopUpi` {#type-shop-upi}

*Type*

Where a UPI payment goes.

```ts
type ShopUpi = {
  id: string;
  name: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `id` | `string` | — |
| `name` | `string` | — |

`id` is the shop's VPA. It can be empty, meaning the shop has not set UPI
up — the pay button says so rather than opening an app with nowhere to
send money.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L129)

### `SubmitGroceryListBody` {#type-submit-grocery-list-body}

*Type*

What is sent to the shop.

```ts
type SubmitGroceryListBody = {
  items: { name: string; quantity: string }[];
  note?: string;
  phone?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `{ … }[]` | — |
| `note?` | `string` | — |
| `phone?` | `string` | — |

Text only. There is no image field and never was — a photo is read into
lines on the phone and discarded before this is built.

`phone` is needed only on a first send; afterwards the server has it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts#L190)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/types.ts)
