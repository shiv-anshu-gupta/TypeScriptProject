# Cart

A customer's basket in the catalogue side of the shop.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Cart.ts` |
| Group | [Server — models](index.md) |
| Exports | 4 |

## Description

One cart per customer, kept between sessions. Separate from the grocery
list, which is the free-text route to the same shop - see GroceryList.ts.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Cart`](#type-cart) | Type | `type Cart = { … };` | One customer's basket. |
| [`Cart`](#variable-cart) | Variable | `const Cart: Model<any, object, object, object, any, any, any>` | The Cart model. |
| [`CartDocument`](#type-cart-document) | Type | `type CartDocument = HydratedDocument<Cart>;` | A saved cart, as Mongoose hands it back. |
| [`CartItem`](#type-cart-item) | Type | `type CartItem = { … };` | One line in the basket. |

## Exports in detail

### `Cart` {#type-cart}

*Type*

One customer's basket.

```ts
type Cart = {
  user: Types.ObjectId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | — |
| `items` | `CartItem[]` | — |
| `updatedAt` | `Date` | — |
| `user` | `Types.ObjectId` | — |

`user` is unique, so a customer can only ever have one cart; the unique
index on it is also what every lookup uses.

Items are embedded rather than a separate collection: a basket is small,
always read whole, and never queried across customers.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Cart.ts#L42)

### `Cart` {#variable-cart}

*Variable*

The Cart model.

```ts
const Cart: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice. The value deliberately shares its name with the
[`Cart`](#variable-cart) type - one is a value, the other a type, and TypeScript keeps
them apart.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Cart.ts#L42)

### `CartDocument` {#type-cart-document}

*Type*

A saved cart, as Mongoose hands it back.

```ts
type CartDocument = HydratedDocument<Cart>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Cart.ts#L50)

### `CartItem` {#type-cart-item}

*Type*

One line in the basket.

```ts
type CartItem = {
  product: Types.ObjectId;
  quantity: number;
  color?: string;
  size?: ProductSize;
};
```

| Property | Type | Meaning |
|---|---|---|
| `color?` | `string` | — |
| `product` | `Types.ObjectId` | — |
| `quantity` | `number` | — |
| `size?` | `ProductSize` | — |

No price is stored. The product is referenced, so what the customer pays is
whatever the catalogue says at checkout, not what it said when they added
the item.

`quantity` is at least 1 - removing a line deletes it rather than setting
zero. `color` and `size` are the chosen variant, absent for products that
have none.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Cart.ts#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Cart.ts)
