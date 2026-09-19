# Grocery list api `api`

Everything the customer does with a list once it has left the phone: sending it, reading it back, chatting about it, paying for it.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/grocery-list/api.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 8 |

## Description

Every call here needs a bearer token and acts on the signed-in customer.
The server scopes each list to its owner, so a list id from another account
answers as not found rather than as someone else's shopping.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getCustomerGroceryLists`](#function-get-customer-grocery-lists) | Function | `function getCustomerGroceryLists(): Promise<CustomerGroceryListsResponse>` | `GET /customer/grocery-lists` — every list this customer has sent. |
| [`getGroceryListMessages`](#function-get-grocery-list-messages) | Function | `function getGroceryListMessages(listId: string): Promise<ChatMessagesResponse>` | `GET /customer/grocery-lists/:id/messages` — the conversation about one order. |
| [`markGroceryListSeen`](#function-mark-grocery-list-seen) | Function | `function markGroceryListSeen(listId: string): Promise<CustomerGroceryList>` | `PATCH /customer/grocery-lists/:id/seen` — clears the "new update" badge. |
| [`payGroceryListAtShop`](#function-pay-grocery-list-at-shop) | Function | `function payGroceryListAtShop(listId: string): Promise<CustomerGroceryList>` | `PATCH /customer/grocery-lists/:id/pay-at-shop` — says the customer will pay at the counter. |
| [`readListPhotos`](#function-read-list-photos) | Function | `function readListPhotos(uris: string[]): Promise<ReadPhotoResponse>` | `POST /customer/grocery-lists/read-photo` — multipart, 60 s. |
| [`removeGroceryListItem`](#function-remove-grocery-list-item) | Function | `function removeGroceryListItem(listId: string, index: number): Promise<CustomerGroceryList>` | `PATCH /customer/grocery-lists/:id/remove-item` — drops one line from a list already sent. |
| [`sendGroceryListMessage`](#function-send-grocery-list-message) | Function | `function sendGroceryListMessage(listId: string, text: string): Promise<ChatMessage>` | `POST /customer/grocery-lists/:id/messages` — says something to the shop about one order. |
| [`submitGroceryList`](#function-submit-grocery-list) | Function | `function submitGroceryList( … ): Promise<NonNullable<CustomerGroceryList & { … }>>` | `POST /customer/grocery-lists` — sends the list to the shop. |

## Exports in detail

### `getCustomerGroceryLists` {#function-get-customer-grocery-lists}

*Function*

`GET /customer/grocery-lists` — every list this customer has sent.

```ts
function getCustomerGroceryLists(): Promise<CustomerGroceryListsResponse>
```

**Returns** `Promise<CustomerGroceryListsResponse>` &mdash; `{ items, unseenCount, upi, customerPhone }`. `customerPhone` is `""` when the customer has none on file.

**Throws**

- Error When signed out, or the request fails.

Carries more than the lists: the shop's UPI details for the pay button, the
number of updates the customer has not seen, and the customer's own saved
mobile number. The send flow calls it for that last field alone, to find
out whether it needs to ask for a number.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L112)

### `getGroceryListMessages` {#function-get-grocery-list-messages}

*Function*

`GET /customer/grocery-lists/:id/messages` — the conversation about one
order.

```ts
function getGroceryListMessages(listId: string): Promise<ChatMessagesResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | — |

**Returns** `Promise<ChatMessagesResponse>` &mdash; `{ messages }`, oldest first.

**Throws**

- Error When signed out, or the request fails.

There is no push channel for chat, so the sheet polls this every five
seconds — and only while it is open.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L188)

### `markGroceryListSeen` {#function-mark-grocery-list-seen}

*Function*

`PATCH /customer/grocery-lists/:id/seen` — clears the "new update" badge.

```ts
function markGroceryListSeen(listId: string): Promise<CustomerGroceryList>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | — |

**Returns** `Promise<CustomerGroceryList>` &mdash; The updated list.

**Throws**

- Error On any failure — callers ignore it, since a badge that clears late is better than an interruption.

Call it only when the customer can actually see the list. An off-screen tab
stays mounted in this app, so a card that marks itself seen without
checking focus clears a badge nobody saw.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L128)

### `payGroceryListAtShop` {#function-pay-grocery-list-at-shop}

*Function*

`PATCH /customer/grocery-lists/:id/pay-at-shop` — says the customer will
pay at the counter.

```ts
function payGroceryListAtShop(listId: string): Promise<CustomerGroceryList>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | — |

**Returns** `Promise<CustomerGroceryList>` &mdash; The updated list.

**Throws**

- Error When the server refuses — a list that is already paid, for instance.

A statement of intent, not a payment: it sets the order's payment method so
the shopkeeper knows not to wait for a UPI transfer. Nothing is charged
here and nothing is charged later by the app.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L147)

### `readListPhotos` {#function-read-list-photos}

*Function*

`POST /customer/grocery-lists/read-photo` — multipart, 60 s.

```ts
function readListPhotos(uris: string[]): Promise<ReadPhotoResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `uris` | `string[]` | Local file URIs from the camera or the gallery, at most `MAX_PHOTOS_PER_SCAN`. The type is guessed from the extension, PNG or JPEG. |

**Returns** `Promise<ReadPhotoResponse>` &mdash; `readable` false when the photo held no list at all, and otherwise the items read, each with the reader's own confidence.

**Throws**

- Error On a timeout as well as on a refusal — 60 s is generous but a bad connection can still exceed it.

Send a photo of a handwritten list up to be READ, and get the items back as
text for the customer's own list. The photo is not stored anywhere - not on
the server, not in the order - so this is the only moment it exists beyond
the phone.

Nothing about it reaches an order: what is sent later is the text the
customer has since been able to correct.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L78)

### `removeGroceryListItem` {#function-remove-grocery-list-item}

*Function*

`PATCH /customer/grocery-lists/:id/remove-item` — drops one line from a
list already sent.

```ts
function removeGroceryListItem(listId: string, index: number): Promise<CustomerGroceryList>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | — |
| `index` | `number` | — |

**Returns** `Promise<CustomerGroceryList>` &mdash; The whole updated list, with the total recalculated, so the caller can replace its stale copy rather than patching it.

**Throws**

- Error When the server refuses, with a message worth showing.

Addressed by **position**, not by name or id, so the index must come from
the list as it is now. Re-read it at the moment of confirming rather than
when a dialog opened, and let only one removal be in flight at a time, or a
second removal will delete the wrong line.

The server decides whether it is allowed at all — only before packing, and
never after payment.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L170)

### `sendGroceryListMessage` {#function-send-grocery-list-message}

*Function*

`POST /customer/grocery-lists/:id/messages` — says something to the shop
about one order.

```ts
function sendGroceryListMessage(listId: string, text: string): Promise<ChatMessage>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | — |
| `text` | `string` | — |

**Returns** `Promise<ChatMessage>` &mdash; The stored message, with the id and timestamp the server gave it — which is what an optimistic sender replaces its placeholder with.

**Throws**

- Error When the send fails; the caller rolls its placeholder back.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L202)

### `submitGroceryList` {#function-submit-grocery-list}

*Function*

`POST /customer/grocery-lists` — sends the list to the shop.

```ts
function submitGroceryList(
  body: SubmitGroceryListBody,
): Promise<NonNullable<CustomerGroceryList & { … }>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `body` | `SubmitGroceryListBody` | — |

Fields of `body` (`SubmitGroceryListBody`):

| Field | Type | Meaning |
|---|---|---|
| `items` | `{ … }[]` | — |
| `note?` | `string` | — |
| `phone?` | `string` | — |

**Returns** `Promise<NonNullable<CustomerGroceryList & { … }>>` &mdash; The created or extended list, with `merged` set when it was appended to an existing one.

**Throws**

- Error When signed out, or the server rejects the items.

The one write that matters. `phone` is only needed the first time; the
server keeps it against the account afterwards.

The shop may not get a new order. If the customer already has a list the
shop has not priced yet, the server appends to that one instead, and says
so with `merged` — the customer is told "added to your list", not "sent".

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts#L38)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/api.ts)
