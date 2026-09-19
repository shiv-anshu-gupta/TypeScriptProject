# Grocery lists api `api`

Every server call the grocery-lists screen makes.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/grocery-lists/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 10 |

## Description

Two things hold for almost all of them, and they shape how the page behaves.

First, each mutation answers with the **whole refreshed array of lists**,
not the record it changed. The hook substitutes its state wholesale, so
nothing here is optimistic and the screen catches up only once the server has
replied. The exception is [`sendAdminGroceryListMessage`](#function-send-admin-grocery-list-message), which returns
just the created message.

Second, several of these make the server send an Expo push to the customer's
phone: pricing, every status step, and marking a line unavailable. They are
not silent bookkeeping, and pressing one twice notifies twice.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`addAdminGroceryListItem`](#function-add-admin-grocery-list-item) | Function | `function addAdminGroceryListItem( … ): Promise<AdminGroceryListsResponse>` | Appends a line the customer asked for after sending the list. |
| [`getAdminConversations`](#function-get-admin-conversations) | Function | `function getAdminConversations(): Promise<AdminConversationsResponse>` | Fetches a summary of every customer conversation. |
| [`getAdminGroceryListMessages`](#function-get-admin-grocery-list-messages) | Function | `function getAdminGroceryListMessages(listId: string): Promise<ChatMessagesResponse>` | Fetches the full chat thread for one order. |
| [`getAdminGroceryLists`](#function-get-admin-grocery-lists) | Function | `function getAdminGroceryLists(): Promise<AdminGroceryListsResponse>` | Fetches every grocery list the shop has. |
| [`markAdminGroceryListPaid`](#function-mark-admin-grocery-list-paid) | Function | `function markAdminGroceryListPaid(listId: string): Promise<AdminGroceryListsResponse>` | Records that the money for an order has arrived. |
| [`sendAdminGroceryListMessage`](#function-send-admin-grocery-list-message) | Function | `function sendAdminGroceryListMessage(listId: string, text: string): Promise<ChatMessage>` | Sends a message from the shop to the customer. |
| [`setAdminGroceryListItemAvailability`](#function-set-admin-grocery-list-item-availability) | Function | `function setAdminGroceryListItemAvailability( … ): Promise<AdminGroceryListsResponse>` | Marks one line out of stock, or puts it back. |
| [`setAdminGroceryListPrices`](#function-set-admin-grocery-list-prices) | Function | `function setAdminGroceryListPrices( … ): Promise<AdminGroceryListsResponse>` | Saves the shopkeeper's prices and tells the customer. |
| [`updateAdminGroceryListItem`](#function-update-admin-grocery-list-item) | Function | `function updateAdminGroceryListItem( … ): Promise<AdminGroceryListsResponse>` | Corrects an existing line's name or quantity. |
| [`updateAdminGroceryListStatus`](#function-update-admin-grocery-list-status) | Function | `function updateAdminGroceryListStatus( … ): Promise<AdminGroceryListsResponse>` | Advances an order one step along the flow, or cancels it. |

## Exports in detail

### `addAdminGroceryListItem` {#function-add-admin-grocery-list-item}

*Function*

Appends a line the customer asked for after sending the list.

```ts
function addAdminGroceryListItem(
  listId: string,
  body: AddGroceryListItemBody,
): Promise<AdminGroceryListsResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |
| `body` | `AddGroceryListItemBody` | The new item's name and quantity. |

**Returns** `Promise<AdminGroceryListsResponse>` &mdash; Every list, refreshed.

**Throws**

- The server's first error message.

`POST /admin/grocery-lists/:id/items`. Usually follows a chat message or a
phone call.

This changes the item count, so the hook drops this list's pricing drafts
afterwards and lets the inputs re-seed from the server. Any price typed but
not yet saved is lost - save prices before adding an item.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L208)

### `getAdminConversations` {#function-get-admin-conversations}

*Function*

Fetches a summary of every customer conversation.

```ts
function getAdminConversations(): Promise<AdminConversationsResponse>
```

**Returns** `Promise<AdminConversationsResponse>` &mdash; One summary per conversation.

**Throws**

- The server's first error message.

`GET /admin/grocery-lists/conversations`. Backs the Messages page, which
repeats it every 15 seconds. Each row carries only the last message; the full
thread is fetched separately when a row is opened.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L229)

### `getAdminGroceryListMessages` {#function-get-admin-grocery-list-messages}

*Function*

Fetches the full chat thread for one order.

```ts
function getAdminGroceryListMessages(listId: string): Promise<ChatMessagesResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |

**Returns** `Promise<ChatMessagesResponse>` &mdash; Every message in the thread.

**Throws**

- The server's first error message.

`GET /admin/grocery-lists/:id/messages`. Called when the chat is opened and
then every 5 seconds while it stays open. The whole thread comes back each
time - there is no incremental fetch - so the poll re-reads everything.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L247)

### `getAdminGroceryLists` {#function-get-admin-grocery-lists}

*Function*

Fetches every grocery list the shop has.

```ts
function getAdminGroceryLists(): Promise<AdminGroceryListsResponse>
```

**Returns** `Promise<AdminGroceryListsResponse>` &mdash; Every list.

**Throws**

- The server's first error message.

`GET /admin/grocery-lists`. Unfiltered and unpaginated - the whole history
arrives in one response, and the status tabs, the amount matcher and the
search box all narrow it in the browser.

This is the call the hook repeats every 15 seconds while the page is open,
and it is also how a newly arrived customer list is noticed.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L44)

### `markAdminGroceryListPaid` {#function-mark-admin-grocery-list-paid}

*Function*

Records that the money for an order has arrived.

```ts
function markAdminGroceryListPaid(listId: string): Promise<AdminGroceryListsResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |

**Returns** `Promise<AdminGroceryListsResponse>` &mdash; Every list, refreshed.

**Throws**

- The server's first error message.

`PATCH /admin/grocery-lists/:id/mark-paid`. Payment is tracked separately
from the packing flow, so this can be done at any stage once the list is
priced, and it does not move the order along.

It cannot be undone from this panel - there is no mark-unpaid button - so the
card offers it only while the list is priced and still unpaid.

Usually reached through the page's amount matcher: the shopkeeper types the
sum just received on UPI, sees the unpaid orders of exactly that total, and
marks the right one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L129)

### `sendAdminGroceryListMessage` {#function-send-admin-grocery-list-message}

*Function*

Sends a message from the shop to the customer.

```ts
function sendAdminGroceryListMessage(listId: string, text: string): Promise<ChatMessage>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |
| `text` | `string` | The message body. |

**Returns** `Promise<ChatMessage>` &mdash; The created message.

**Throws**

- The server's first error message.

`POST /admin/grocery-lists/:id/messages`. Note that it returns only the
created message, not the thread - the one call on this screen that does not
answer with a refreshed collection.

The chat clears its input before this resolves and puts the text back, with a
toast, if it fails. That is the only optimistic behaviour anywhere on this
screen.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L270)

### `setAdminGroceryListItemAvailability` {#function-set-admin-grocery-list-item-availability}

*Function*

Marks one line out of stock, or puts it back.

```ts
function setAdminGroceryListItemAvailability(
  listId: string,
  index: number,
  available: boolean,
): Promise<AdminGroceryListsResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |
| `index` | `number` | Position of the item within `list.items`. Positional, so it would be invalidated by anything that reorders the array. |
| `available` | `boolean` | `false` to mark out of stock. |

**Returns** `Promise<AdminGroceryListsResponse>` &mdash; Every list, refreshed.

**Throws**

- The server's first error message.

`PATCH /admin/grocery-lists/:id/items/:index/availability`. Applies at once,
with no draft step, unlike prices.

Marking a line unavailable forces its price to 0 on the server and pushes the
customer to tell them. Restoring does neither - no push is sent on the way
back, and any price the line had is already gone.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L153)

### `setAdminGroceryListPrices` {#function-set-admin-grocery-list-prices}

*Function*

Saves the shopkeeper's prices and tells the customer.

```ts
function setAdminGroceryListPrices(
  listId: string,
  body: SetGroceryListPricesBody,
): Promise<AdminGroceryListsResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |
| `body` | `SetGroceryListPricesBody` | All line prices, in item order. See [`SetGroceryListPricesBody`](features-admin-grocery-lists-types.md#type-set-grocery-list-prices-body). |

**Returns** `Promise<AdminGroceryListsResponse>` &mdash; Every list, refreshed.

**Throws**

- The server's first error message.

`PATCH /admin/grocery-lists/:id/prices`. The most consequential call on this
page. On the server it writes every line price, sets `status` to `priced`,
stamps `pricedAt`, clears the customer's "seen" flag, and sends the customer
an Expo push carrying the new total. That push is awaited rather than left to
finish on its own, because the serverless function is frozen as soon as it
responds.

Two consequences of the hard status write:

- It is not idempotent from the customer's point of view. Saving twice sends
  two "your list is priced" notifications.
- It moves a list *backwards*. A list already at `packed` or `ready` returns
  to `priced` and the flow buttons reset. The "Update prices" button stays
  enabled at those stages, so this is reachable by accident.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L73)

### `updateAdminGroceryListItem` {#function-update-admin-grocery-list-item}

*Function*

Corrects an existing line's name or quantity.

```ts
function updateAdminGroceryListItem(
  listId: string,
  index: number,
  body: AddGroceryListItemBody,
): Promise<AdminGroceryListsResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |
| `index` | `number` | Position of the item within `list.items`. |
| `body` | `AddGroceryListItemBody` | The replacement name and quantity. |

**Returns** `Promise<AdminGroceryListsResponse>` &mdash; Every list, refreshed.

**Throws**

- The server's first error message.

`PATCH /admin/grocery-lists/:id/items/:index`. For fixing a customer's
wording - an unclear abbreviation, a missing unit - without changing how many
lines the order has.

Because the item count is unchanged, the hook keeps this list's pricing
drafts rather than discarding them, so a half-typed price survives the edit.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L181)

### `updateAdminGroceryListStatus` {#function-update-admin-grocery-list-status}

*Function*

Advances an order one step along the flow, or cancels it.

```ts
function updateAdminGroceryListStatus(
  listId: string,
  body: UpdateGroceryListStatusBody,
): Promise<AdminGroceryListsResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `listId` | `string` | The list's `_id`. |
| `body` | `UpdateGroceryListStatusBody` | The target status. `received` and `priced` are not reachable here; see [`UpdateGroceryListStatusBody`](features-admin-grocery-lists-types.md#type-update-grocery-list-status-body). |

**Returns** `Promise<AdminGroceryListsResponse>` &mdash; Every list, refreshed.

**Throws**

- The server's first error message.

`PATCH /admin/grocery-lists/:id/status`. The server pushes the customer on
each step.

The card only ever offers the immediate next step, so this is not a way to
jump stages from the UI - though the endpoint itself accepts any allowed
status.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts#L100)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/grocery-lists/api.ts)
