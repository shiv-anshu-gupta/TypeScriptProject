# Promo

Discount codes for catalogue orders.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Promo.ts` |
| Group | [Server — models](index.md) |
| Exports | 3 |

## Description

Created by the shop in routes/admin/promo.routes.ts and applied at checkout.
Grocery lists are priced by hand and do not use these.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Promo`](#type-promo) | Type | `type Promo = { … };` | One discount code. |
| [`Promo`](#variable-promo) | Variable | `const Promo: Model<any, object, object, object, any, any, any>` | The Promo model. |
| [`PromoDocument`](#type-promo-document) | Type | `type PromoDocument = HydratedDocument<Promo>;` | A saved promo, as Mongoose hands it back. |

## Exports in detail

### `Promo` {#type-promo}

*Type*

One discount code.

```ts
type Promo = {
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `code` | `string` | — |
| `count` | `number` | — |
| `createdAt` | `Date` | — |
| `endsAt` | `Date` | — |
| `minimumOrderValue` | `number` | — |
| `percentage` | `number` | — |
| `startsAt` | `Date` | — |
| `updatedAt` | `Date` | — |

- `code` is unique and stored uppercase, so a customer typing it in any
  case matches. The unique index is what stops two codes colliding.
- `percentage` is 1-100, enforced by the schema; there is no flat-amount
  discount.
- `count` is how many uses remain, at least 1 - the checkout route is what
  decrements it, not this model.
- `minimumOrderValue` is in rupees, the subtotal the order must reach
  before the code applies.
- `startsAt` and `endsAt` are both required, so every code has a window;
  whether that window is checked is the checkout route's business, not the
  schema's.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Promo.ts#L28)

### `Promo` {#variable-promo}

*Variable*

The Promo model.

```ts
const Promo: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice.

`code` being unique gives it an index, which is also the one every lookup
uses - a code is only ever fetched by its own text.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Promo.ts#L28)

### `PromoDocument` {#type-promo-document}

*Type*

A saved promo, as Mongoose hands it back.

```ts
type PromoDocument = HydratedDocument<Promo>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Promo.ts#L40)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Promo.ts)
