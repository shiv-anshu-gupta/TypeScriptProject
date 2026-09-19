# sizedProduct `productImages`

Shaping a product for the wire, so its pictures arrive at the size they are drawn at.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/productImages.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`sizedProduct`](#function-sized-product) | Function | `function sizedProduct( … }` | A product on its way out of the server, with its pictures asked for at the size they will actually be drawn - small in a grid, larger on the product's own page. |

## Exports in detail

### `sizedProduct` {#function-sized-product}

*Function*

A product on its way out of the server, with its pictures asked for at the
size they will actually be drawn - small in a grid, larger on the product's
own page. Everything else about the product goes back untouched.

```ts
function sizedProduct(
  product: Document<unknown, object, Product, object, DefaultSchemaOptions> & Product & { _id: ObjectId } & { __v: number } & { id: string },
  variant: "thumb" | "card" | "detail" | "banner",
): {
  _id: ObjectId;
  __v: number;
  title: string;
  description: string;
  category: ObjectId;
  brand: string;
  stock: number;
  colors: string[];
  sizes: ProductSize[];
  unit: ProductUnit;
  unitValue: number;
  status: ProductStatus;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  images: { … }[];
}
```

| Parameter | Type | Meaning |
|---|---|---|
| `product` | `Document<unknown, object, Product, object, DefaultSchemaOptions> & Product & { … } & { … } & { … }` | — |
| `variant` | `"thumb" \| "card" \| "detail" \| "banner"` | which width to ask Cloudinary for; see [`ImageVariant`](utils-cloudinary.md#type-image-variant). |

**Returns** `{ _id: ObjectId; __v: number; title: string; description: string; category: ObjectId; brand: string; stock: …` &mdash; A plain object (the document is converted with `toObject`), so it is no longer a Mongoose document and cannot be saved.

Only the ADDRESS changes; the database keeps the original picture, so a
product can be re-sized differently tomorrow without touching a record.

Call this on every product leaving a route. The product list endpoints use
`"card"` and a product's own page uses `"detail"`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/productImages.ts#L27)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/productImages.ts)
