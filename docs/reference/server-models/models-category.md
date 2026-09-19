# Category

The shelves the catalogue is divided into.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Category.ts` |
| Group | [Server — models](index.md) |
| Exports | 3 |

## Description

A category is little more than a name and a picture; products point at one
through their `category` field. Small and rarely changed, so it carries no
index of its own beyond `_id`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Category`](#type-category) | Type | `type Category = { … };` | One category. |
| [`Category`](#variable-category) | Variable | `const Category: Model<any, object, object, object, any, any, any>` | The Category model. |
| [`CategoryDocument`](#type-category-document) | Type | `type CategoryDocument = HydratedDocument<Category>;` | A saved category, as Mongoose hands it back. |

## Exports in detail

### `Category` {#type-category}

*Type*

One category.

```ts
type Category = {
  name: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | — |
| `imagePublicId` | `string` | — |
| `imageUrl` | `string` | — |
| `name` | `string` | — |
| `updatedAt` | `Date` | — |

The picture is optional and both its fields default to `""` - a category
with no image shows as a plain chip in the app. When one is set,
`imagePublicId` is the Cloudinary handle needed to delete it later.

Names are not unique in the schema; nothing stops two categories being
called the same thing.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Category.ts#L24)

### `Category` {#variable-category}

*Variable*

The Category model.

```ts
const Category: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice.

Deleting a category does NOT touch the products that point at it - they are
left referencing an id that no longer resolves, and populate yields null.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Category.ts#L24)

### `CategoryDocument` {#type-category-document}

*Type*

A saved category, as Mongoose hands it back.

```ts
type CategoryDocument = HydratedDocument<Category>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Category.ts#L33)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Category.ts)
