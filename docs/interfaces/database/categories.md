# `categories` {#categories}

`server/src/models/Category.ts` · model `Category` · **13 live documents**
(2026-09-19).

## Purpose

The shelves the catalogue is divided into. A category is little more than a
name and a picture; products point at one through their `category` field. Small
and rarely changed, so it carries no index of its own beyond `_id`.

## Fields

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `name` | String | — | yes | Trimmed. Bilingual in production, for example `"बेबी प्रोडक्ट्स / Baby Products"`, written by `server/src/scripts/rename-categories-bilingual.ts` |
| `imageUrl` | String | `""` | no | The Cloudinary delivery address, shown in the app's category rail. A category with no image shows as a plain chip |
| `imagePublicId` | String | `""` | no | The Cloudinary handle needed to delete the picture later |
| `createdAt` and `updatedAt` | Date | auto | — | `{ timestamps: true }` |

Both image fields default to `""` rather than being left undefined, so a
category created without a picture still has the keys.

## Sub-documents

None.

## Enums

None.

## Indexes {#indexes}

**Declared:** none.

**Live**, as checked on 2026-09-19: `_id_` only. No mismatch. All 13 documents
have every field populated.

???+ warning "`name` is not unique, in the schema or the database"
    Nothing stops two categories being called the same thing. Duplicates are
    prevented only by `server/src/scripts/seed-categories.ts` skipping names it
    already sees, and by the admin not typing one twice.
    `POST /admin/categories` does not check.

## Invariants enforced in routes, not the schema {#invariants}

| Invariant | Where |
|---|---|
| **A category with products cannot be deleted.** Every product holds a required reference to its category, so the route counts products first and answers 400 quoting the live count | `adminProductRouter` `DELETE /categories/:id` in `server/src/routes/admin/product.routes.ts` |
| That count is taken at the moment of the check and not under a transaction, so a product created between the count and the delete would still be orphaned | same |
| `name` is required and trimmed on create and update | `adminProductRouter` `POST /categories` and `PUT /categories/:id`, same file |
| A category id used as a banner's tap target must exist at write time, checked with an `exists` query | `readLink` in `server/src/routes/admin/settings.routes.ts` |

## Cascades {#cascades}

Deleting a category does **not** touch the products that point at it — but the
route above makes that unreachable while any product does. The model's own note
records the consequence if it ever happened: products would be left
referencing an id that no longer resolves, and `populate` would yield `null`.

A banner linking to a deleted category is **not** cleaned up. `link.targetId`
is a plain string, not a ref, so the banner survives and simply stops going
anywhere useful: [`/customer/home`](../api/home.md) degrades the tap action to
`none`, and the admin view shows a `targetId` with no `targetName`.

## Cloudinary {#cloudinary}

| Action | The Cloudinary asset |
|---|---|
| Create with an image | uploaded to `ecommerce-monster-video/categories`, shrunk to fit a 1600 px box at `quality: auto:good` |
| Replace the image via `PUT` | the new file is uploaded; **the old one is left behind**, its `publicId` simply overwritten |
| Remove the image | not possible — omitting the file on `PUT` keeps the stored one |
| Delete the category | **the asset is left behind**, even though `imagePublicId` is on the document about to be discarded |

## Where a category document is read and written

| Route | Reads | Writes |
|---|---|---|
| [`GET /admin/categories`](../api/products-admin.md#get-admin-categories) | all, A to Z, raw | — |
| [`POST /admin/categories`](../api/products-admin.md#post-admin-categories) | — | insert |
| [`PUT /admin/categories/:id`](../api/products-admin.md#put-admin-category) | by id | `name`, and the two image fields |
| [`DELETE /admin/categories/:id`](../api/products-admin.md#delete-admin-category) | by id | delete |
| [`GET /customer/categories`](../api/products-customer.md#get-customer-categories) | all, A to Z, raw and full-size | — |
| [`GET /customer/home`](../api/home.md) | all, A to Z, with 200 px `thumb` images | — |
| [`GET /admin/dashboard/lite`](../api/dashboard.md#get-lite) | `countDocuments` | — |
| Product create and update | `findById`, to validate the reference | — |
| Banner `readLink` and `targetNames` | `exists`, and `name` for display | — |

Note that `/customer/categories` and `/customer/home` return the same
collection differently: the first raw and full-size with `imagePublicId` and
`__v`, the second mapped to `{ _id, name, imageUrl }` with a thumbnail.

## Migration scripts

Two scripts touch this collection and neither runs in normal operation:
`server/src/scripts/seed-categories.ts` inserts the starting set, skipping
names it already sees; `server/src/scripts/migrate-categories.ts` merges
categories and `deleteOne`s the source.

## Multi-tenant note

Classification only. `categories` would become **shop-scoped**: category CRUD
is per-catalogue, and the delete guard counts only that catalogue's products. A
shared taxonomy is possible but would need a per-shop join to decide which
categories a shop shows — more work, not less.
