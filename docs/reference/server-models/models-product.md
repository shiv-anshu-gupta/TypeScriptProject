# Product

The shop's catalogue.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Product.ts` |
| Group | [Server — models](index.md) |
| Exports | 7 |

## Description

Products are what the Shop tab lists and what a cart and an order refer to.
A grocery list does not use them at all - it is free text.

Pictures are stored at their uploaded address and resized in the URL on the
way out; see utils/cloudinary.ts and utils/productImages.ts.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Product`](#type-product) | Type | `type Product = { … };` | One product. |
| [`Product`](#variable-product) | Variable | `const Product: Model<any, object, object, object, any, any, any>` | The Product model. |
| [`ProductDocument`](#type-product-document) | Type | `type ProductDocument = HydratedDocument<Product>;` | A saved product, as Mongoose hands it back. |
| [`ProductImage`](#type-product-image) | Type | `type ProductImage = { … };` | One picture of a product. |
| [`ProductSize`](#type-product-size) | Type | `type ProductSize = "S" \| "M" \| "L" \| "XL";` | Clothing sizes, for products that have them. |
| [`ProductStatus`](#type-product-status) | Type | `type ProductStatus = "active" \| "inactive";` | Whether a product is on sale. |
| [`ProductUnit`](#type-product-unit) | Type | `type ProductUnit = "kg" \| "g" \| "litre" \| "ml" \| "piece" \| "dozen" \| "pack";` | How a product is measured. |

## Exports in detail

### `Product` {#type-product}

*Type*

One product. Notes on individual fields are beside the fields.

```ts
type Product = {
  title: string;
  description: string;
  category: Types.ObjectId;
  brand: string;
  stock: number;
  images: ProductImage[];
  colors: string[];
  sizes: ProductSize[];
  unit: ProductUnit;
  unitValue: number;
  status: ProductStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `brand` | `string` | — |
| `category` | `Types.ObjectId` | — |
| `colors` | `string[]` | — |
| `createdAt` | `Date` | — |
| `createdBy` | `Types.ObjectId` | — |
| `description` | `string` | — |
| `images` | `ProductImage[]` | — |
| `sizes` | `ProductSize[]` | — |
| `status` | `ProductStatus` | — |
| `stock` | `number` | — |
| `title` | `string` | — |
| `unit` | `ProductUnit` | — |
| `unitValue` | `number` | — |
| `updatedAt` | `Date` | — |

There is no price field. Money is settled per order - on a grocery list by
the shopkeeper pricing each line, and on a catalogue order by the total
recorded at checkout.

`stock` is a plain count and is not decremented by this model; whether an
order reduces it is the routes' business.

`colors` and `sizes` are the variants offered, and may both be empty - a
bag of rice has neither.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts#L74)

### `Product` {#variable-product}

*Variable*

The Product model.

```ts
const Product: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice.

Prefer deactivating a product to deleting it: carts and past orders hold
its id, and a deleted one populates as null.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts#L74)

### `ProductDocument` {#type-product-document}

*Type*

A saved product, as Mongoose hands it back.

```ts
type ProductDocument = HydratedDocument<Product>;
```

What `sizedProduct` (utils/productImages.ts) takes, on the way out to a
client.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts#L100)

### `ProductImage` {#type-product-image}

*Type*

One picture of a product.

```ts
type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};
```

| Property | Type | Meaning |
|---|---|---|
| `isCover` | `boolean` | — |
| `publicId` | `string` | — |
| `url` | `string` | — |

`url` is the Cloudinary delivery address as uploaded, without any
transformation - `cdnImage` adds one per request. `publicId` is the handle
that can delete it.

`isCover` marks the one shown in listings. Nothing here enforces that
exactly one image carries it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts#L26)

### `ProductSize` {#type-product-size}

*Type*

Clothing sizes, for products that have them.

```ts
type ProductSize = "S" | "M" | "L" | "XL";
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts#L33)

### `ProductStatus` {#type-product-status}

*Type*

Whether a product is on sale.

```ts
type ProductStatus = "active" | "inactive";
```

`inactive` hides it from customers without deleting it, so its history in
past orders stays intact. Every customer-facing query filters on this,
which is why it leads all three indexes below.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts#L43)

### `ProductUnit` {#type-product-unit}

*Type*

How a product is measured.

```ts
type ProductUnit = "kg" | "g" | "litre" | "ml" | "piece" | "dozen" | "pack";
```

Paired with `unitValue` to describe one sellable item - see the note there.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts#L51)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Product.ts)
