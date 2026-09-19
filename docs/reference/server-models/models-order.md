# Order

An order placed through the catalogue and cart, paid for up front.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Order.ts` |
| Group | [Server — models](index.md) |
| Exports | 6 |

## Description

The other, more used path through the shop is the hand-priced grocery list
- see GroceryList.ts. This one is the conventional e-commerce flow: pick
from the catalogue, apply a promo code, pay with Razorpay, then track
delivery.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Order`](#type-order) | Type | `type Order = { … };` | One order. |
| [`Order`](#variable-order) | Variable | `const Order: Model<any, object, object, object, any, any, any>` | The Order model. |
| [`OrderDocument`](#type-order-document) | Type | `type OrderDocument = HydratedDocument<Order>;` | A saved order, as Mongoose hands it back. |
| [`OrderItem`](#type-order-item) | Type | `type OrderItem = { … };` | One line of an order. |
| [`OrderStatus`](#type-order-status) | Type | `type OrderStatus = "placed" \| "shipped" \| "delivered" \| "returned";` | Where the goods have got to. |
| [`PaymentStatus`](#type-payment-status) | Type | `type PaymentStatus = "pending" \| "paid" \| "failed";` | Whether the money for an order arrived. |

## Exports in detail

### `Order` {#type-order}

*Type*

One order.

```ts
type Order = {
  user: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalItems: number;
  deliveryName: string;
  deliveryAddress: string;
  promoCode?: string;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId: string;
  paymentId?: string;
  paidAt?: Date | null;
  deliveredAt?: Date | null;
  returnedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | — |
| `customerEmail` | `string` | — |
| `customerName` | `string` | — |
| `deliveredAt?` | `Date \| null` | — |
| `deliveryAddress` | `string` | — |
| `deliveryName` | `string` | — |
| `discountAmount` | `number` | — |
| `items` | `OrderItem[]` | — |
| `orderStatus` | `OrderStatus` | — |
| `paidAt?` | `Date \| null` | — |
| `paymentId?` | `string` | — |
| `paymentStatus` | `PaymentStatus` | — |
| `promoCode?` | `string` | — |
| `razorpayOrderId` | `string` | — |
| `returnedAt?` | `Date \| null` | — |
| `totalAmount` | `number` | — |
| `totalItems` | `number` | — |
| `updatedAt` | `Date` | — |
| `user` | `Types.ObjectId` | — |

`customerName` and `customerEmail`, like `deliveryName` and
`deliveryAddress`, are copied onto the order, so a later change to the
customer's profile does not rewrite where a past order went.

Money is in rupees: `discountAmount` is what the promo code took off and
`totalAmount` is what the customer was actually charged, after it.
`promoCode` is stored uppercase to match Promo.ts.

`razorpayOrderId` is required, so an order row exists only once Razorpay
has been asked to take the money; `paymentId` arrives when it succeeds.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Order.ts#L62)

### `Order` {#variable-order}

*Variable*

The Order model.

```ts
const Order: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Order.ts#L62)

### `OrderDocument` {#type-order-document}

*Type*

A saved order, as Mongoose hands it back.

```ts
type OrderDocument = HydratedDocument<Order>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Order.ts#L85)

### `OrderItem` {#type-order-item}

*Type*

One line of an order.

```ts
type OrderItem = {
  product: Types.ObjectId;
  quantity: number;
};
```

| Property | Type | Meaning |
|---|---|---|
| `product` | `Types.ObjectId` | — |
| `quantity` | `number` | — |

Only the product and how many. No price is copied, so an order's lines
cannot be re-priced from the document itself - `totalAmount` on the order
is the record of what was charged.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Order.ts#L42)

### `OrderStatus` {#type-order-status}

*Type*

Where the goods have got to.

```ts
type OrderStatus = "placed" | "shipped" | "delivered" | "returned";
```

`placed` on creation, then `shipped` and `delivered` as the shop moves it
along, each stamping its date. `returned` is the end of an order that came
back. Nothing in the schema enforces the order of these.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Order.ts#L32)

### `PaymentStatus` {#type-payment-status}

*Type*

Whether the money for an order arrived.

```ts
type PaymentStatus = "pending" | "paid" | "failed";
```

Moves to `paid` only once Razorpay's signature has been verified on the
server. `failed` is a payment that was attempted and refused; an order that
was simply never paid for stays `pending`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Order.ts#L22)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Order.ts)
