# GroceryList

The shop's main order: a free-text grocery list, priced by hand.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/GroceryList.ts` |
| Group | [Server — models](index.md) |
| Exports | 7 |

## Description

A customer writes a free-text grocery list (item + quantity, no price).
The shopkeeper receives it, fills in a price per item, and sends it back.
The customer then pays online or at the shop on pickup.

This is the path most customers take, rather than the catalogue and cart.
Handled by routes/customer/grocery-list.routes.ts and
routes/admin/grocery-list.routes.ts; the conversation about a list lives in
Message.ts.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`GroceryList`](#type-grocery-list) | Type | `type GroceryList = { … };` | One list. |
| [`GroceryList`](#variable-grocery-list) | Variable | `const GroceryList: Model<any, object, object, object, any, any, any>` | The GroceryList model. |
| [`GroceryListDocument`](#type-grocery-list-document) | Type | `type GroceryListDocument = HydratedDocument<GroceryList>;` | A saved list, as Mongoose hands it back. |
| [`GroceryListItem`](#type-grocery-list-item) | Type | `type GroceryListItem = { … };` | One line of the list. |
| [`GroceryListPaymentMethod`](#type-grocery-list-payment-method) | Type | `type GroceryListPaymentMethod = "online" \| "upi" \| "at_shop";` | How the customer chose to pay. |
| [`GroceryListPaymentStatus`](#type-grocery-list-payment-status) | Type | `type GroceryListPaymentStatus = "pending" \| "paid";` | Whether the money has arrived. |
| [`GroceryListStatus`](#type-grocery-list-status) | Type | `type GroceryListStatus = "received" \| "priced" \| "packing" \| "packed" \| "ready" \| "completed" \| "cancelled";` | Where a list has got to. |

## Exports in detail

### `GroceryList` {#type-grocery-list}

*Type*

One list. Notes on individual fields are beside the fields.

```ts
type GroceryList = {
  user: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: GroceryListItem[];
  totalItems: number;
  totalAmount: number;
  status: GroceryListStatus;
  paymentMethod: GroceryListPaymentMethod;
  paymentStatus: GroceryListPaymentStatus;
  razorpayOrderId: string;
  paymentId: string;
  seenByCustomer: boolean;
  note: string;
  pricedAt?: Date | null;
  packedAt?: Date | null;
  readyAt?: Date | null;
  completedAt?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `completedAt?` | `Date \| null` | — |
| `createdAt` | `Date` | — |
| `customerEmail` | `string` | — |
| `customerName` | `string` | — |
| `customerPhone` | `string` | — |
| `items` | `GroceryListItem[]` | — |
| `note` | `string` | — |
| `packedAt?` | `Date \| null` | — |
| `paidAt?` | `Date \| null` | — |
| `paymentId` | `string` | — |
| `paymentMethod` | `GroceryListPaymentMethod` | — |
| `paymentStatus` | `GroceryListPaymentStatus` | — |
| `pricedAt?` | `Date \| null` | — |
| `razorpayOrderId` | `string` | — |
| `readyAt?` | `Date \| null` | — |
| `seenByCustomer` | `boolean` | — |
| `status` | `GroceryListStatus` | — |
| `totalAmount` | `number` | — |
| `totalItems` | `number` | — |
| `updatedAt` | `Date` | — |
| `user` | `Types.ObjectId` | — |

`customerName`, `customerEmail` and `customerPhone` are copied onto the
list rather than read through `user`, so the shop still has the details it
was given at the time even if the customer later changes them.

`totalAmount` stays 0 until the shopkeeper prices the list, so it cannot be
read as "free" - `status` says whether it means anything yet.

Items are capped at `MAX_ITEMS_PER_LIST` (utils/sanitizeItem.ts), enforced
by the routes when adding to an existing list, not by this schema.

The `...At` dates are stamps, written once when the list reaches that step
and left alone afterwards.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts#L106)

### `GroceryList` {#variable-grocery-list}

*Variable*

The GroceryList model.

```ts
const GroceryList: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice.

Lists are never deleted - a cancelled one keeps its `cancelled` status, so
the shop's history stays whole.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts#L106)

### `GroceryListDocument` {#type-grocery-list-document}

*Type*

A saved list, as Mongoose hands it back.

```ts
type GroceryListDocument = HydratedDocument<GroceryList>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts#L134)

### `GroceryListItem` {#type-grocery-list-item}

*Type*

One line of the list.

```ts
type GroceryListItem = {
  name: string;
  quantity: string;
  rate?: number;
  price: number;
  available: boolean;
};
```

| Property | Type | Meaning |
|---|---|---|
| `available` | `boolean` | — |
| `name` | `string` | — |
| `price` | `number` | — |
| `quantity` | `string` | — |
| `rate?` | `number` | — |

`name` and `quantity` are the customer's own words - `quantity` is free
text ("2 kg", "1 packet") rather than a number, because that is how people
write a list and forcing units would slow them down.

`rate` and `price` are in rupees and both start at 0; the shopkeeper fills
them in when pricing. `price` is the line total and is what sums to the
list's `totalAmount`.

`available` false is the shop saying it is out of stock. The line stays on
the list so the customer can see what they will not be getting.

Every name and quantity here has been through utils/sanitizeItem.ts,
whether it was typed or read off a photograph.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts#L77)

### `GroceryListPaymentMethod` {#type-grocery-list-payment-method}

*Type*

How the customer chose to pay.

```ts
type GroceryListPaymentMethod = "online" | "upi" | "at_shop";
```

`online` is a Razorpay order; `upi` is a direct transfer to the shop;
`at_shop` is cash or card on collection and is the default, since that is
what most customers do.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts#L47)

### `GroceryListPaymentStatus` {#type-grocery-list-payment-status}

*Type*

Whether the money has arrived.

```ts
type GroceryListPaymentStatus = "pending" | "paid";
```

Only ever set to `paid` by the server, after Razorpay's signature has been
verified or the shopkeeper has confirmed payment at the counter - never on
the client's word.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts#L57)

### `GroceryListStatus` {#type-grocery-list-status}

*Type*

Where a list has got to. The meaning of each value is beside it.

```ts
type GroceryListStatus = "received" | "priced" | "packing" | "packed" | "ready" | "completed" | "cancelled";
```

Normal progression is received - priced - packing - packed - ready -
completed, with `cancelled` reachable from anywhere. Nothing in the schema
enforces the order; the admin routes decide which move is offered, and each
step stamps its own `...At` date.

`priced` is the one the customer is waiting for: it is when a total exists
and payment becomes possible.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts#L30)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/GroceryList.ts)
