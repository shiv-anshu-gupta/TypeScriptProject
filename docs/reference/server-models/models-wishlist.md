# Wishlist

Products a customer has saved for later.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Wishlist.ts` |
| Group | [Server — models](index.md) |
| Exports | 3 |

## Description

One wishlist per customer, alongside their cart - see Cart.ts. Handled
together in routes/customer/cart-wishlist.routes.ts.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Wishlist`](#type-wishlist) | Type | `type Wishlist = { … };` | One customer's saved products. |
| [`Wishlist`](#variable-wishlist) | Variable | `const Wishlist: Model<any, object, object, object, any, any, any>` | The Wishlist model. |
| [`WishlistDocument`](#type-wishlist-document) | Type | `type WishlistDocument = HydratedDocument<Wishlist>;` | A saved wishlist, as Mongoose hands it back. |

## Exports in detail

### `Wishlist` {#type-wishlist}

*Type*

One customer's saved products.

```ts
type Wishlist = {
  user: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | — |
| `products` | `Types.ObjectId[]` | — |
| `updatedAt` | `Date` | — |
| `user` | `Types.ObjectId` | — |

Just references, with no quantity or variant - a wishlist records interest,
not an intention to buy a particular one.

`user` is unique, so a customer has at most one. Nothing stops the same
product appearing twice; the routes are what keep the list distinct.

A product that is later deleted leaves an id here that populates as null.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Wishlist.ts#L24)

### `Wishlist` {#variable-wishlist}

*Variable*

The Wishlist model.

```ts
const Wishlist: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice. The unique index on `user` is also the only one a lookup
needs.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Wishlist.ts#L24)

### `WishlistDocument` {#type-wishlist-document}

*Type*

A saved wishlist, as Mongoose hands it back.

```ts
type WishlistDocument = HydratedDocument<Wishlist>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Wishlist.ts#L32)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Wishlist.ts)
