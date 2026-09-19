# Banner

The promotional images across the top of the app's Home screen.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/Banner.ts` |
| Group | [Server — models](index.md) |
| Exports | 8 |

## Description

A banner is a picture the shop uploads, ordered by hand, optionally
scheduled, and optionally linked to somewhere in the app. Managed by the
admin in routes/admin/settings.routes.ts and served to the app by
routes/customer/home.routes.ts.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Banner`](#constant-banner) | Constant | `const Banner: Model<any, object, object, object, any, any, any>` | The Banner model. |
| [`BANNER_LINK_TYPES`](#constant-banner-link-types) | Constant | `const BANNER_LINK_TYPES: readonly ["none", "writeList", "shop", "category", "product"]` | What a banner opens when a customer taps it in the app. |
| [`BannerDocument`](#type-banner-document) | Type | `type BannerDocument = HydratedDocument<BannerItem>;` | A saved banner, as Mongoose hands it back. |
| [`BannerItem`](#type-banner-item) | Type | `type BannerItem = { … };` | One banner. |
| [`BannerLink`](#type-banner-link) | Type | `type BannerLink = { … };` | Where a tap on the banner goes. |
| [`BannerLinkType`](#type-banner-link-type) | Type | `type BannerLinkType = typeof BANNER_LINK_TYPES[number];` | One of [`BANNER_LINK_TYPES`](#constant-banner-link-types). |
| [`HOME_BANNER_LIMIT`](#constant-home-banner-limit) | Constant | `const HOME_BANNER_LIMIT: 8` | How many live banners the Home carousel shows. |
| [`liveBannerFilter`](#function-live-banner-filter) | Function | `function liveBannerFilter(now: Date): { isActive: { $ne: boolean }; $and: ({ … } \| { … })[] }` | Banners the app should show right now: switched on and inside their window. |

## Exports in detail

### `Banner` {#constant-banner}

*Constant*

The Banner model.

```ts
const Banner: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so that a hot reload, which runs this
module again, does not try to compile the same model twice.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L148)

### `BANNER_LINK_TYPES` {#constant-banner-link-types}

*Constant*

What a banner opens when a customer taps it in the app.

```ts
const BANNER_LINK_TYPES: readonly ["none", "writeList", "shop", "category", "product"]
```

The meaning of each value is on the line beside it. `category` and
`product` need a `targetId`; the rest ignore it. Nothing in the schema
enforces that pairing - the admin route validates it, and the app treats a
link it cannot follow as `none`.

The order of this array is not meaningful; it is the source of the schema's
enum and of [`BannerLinkType`](#type-banner-link-type).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L26)

### `BannerDocument` {#type-banner-document}

*Type*

A saved banner, as Mongoose hands it back.

```ts
type BannerDocument = HydratedDocument<BannerItem>;
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L79)

### `BannerItem` {#type-banner-item}

*Type*

One banner. Field-by-field notes are beside the fields.

```ts
type BannerItem = {
  imageUrl: string;
  imagePublicId: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  link: BannerLink;
  startsAt: Date | null;
  endsAt: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
```

| Property | Type | Meaning |
|---|---|---|
| `createdAt` | `Date` | — |
| `createdBy` | `Types.ObjectId` | — |
| `endsAt` | `Date \| null` | — |
| `imagePublicId` | `string` | — |
| `imageUrl` | `string` | — |
| `isActive` | `boolean` | — |
| `link` | `BannerLink` | — |
| `sortOrder` | `number` | — |
| `startsAt` | `Date \| null` | — |
| `title` | `string` | — |
| `updatedAt` | `Date` | — |

Both `imageUrl` and `imagePublicId` come from the Cloudinary upload; the id
is what later deletes the picture, so neither is optional.

`startsAt` and `endsAt` are a half-open window - a banner is live from
`startsAt` inclusive until `endsAt` exclusive. `null` on either side means
unbounded. See [`liveBannerFilter`](#function-live-banner-filter).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L60)

### `BannerLink` {#type-banner-link}

*Type*

Where a tap on the banner goes.

```ts
type BannerLink = {
  type: BannerLinkType;
  targetId?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `targetId?` | `string` | — |
| `type` | `BannerLinkType` | — |

`targetId` is the category or product id for those two types, held as a
plain string rather than an ObjectId ref, so a banner survives the target
being deleted - it just stops going anywhere useful.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L44)

### `BannerLinkType` {#type-banner-link-type}

*Type*

One of [`BANNER_LINK_TYPES`](#constant-banner-link-types).

```ts
type BannerLinkType = typeof BANNER_LINK_TYPES[number];
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L34)

### `HOME_BANNER_LIMIT` {#constant-home-banner-limit}

*Constant*

How many live banners the Home carousel shows.

```ts
const HOME_BANNER_LIMIT: 8
```

Applied as the `limit` on the Home query and also sent to the admin panel,
so the shop is told the ceiling rather than discovering that a ninth banner
never appears.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L139)

### `liveBannerFilter` {#function-live-banner-filter}

*Function*

Banners the app should show right now: switched on and inside their window.
Older banners saved before these fields existed count as on and unscheduled.

```ts
function liveBannerFilter(now: Date): { isActive: { $ne: boolean }; $and: ({ … } | { … })[] }
```

| Parameter | Type | Meaning |
|---|---|---|
| `now` | `Date` | the instant to judge against. Passed in rather than read here so that one request judges every banner at the same moment. |

**Returns** `{ isActive: { … }; $and: ({ … } \| { … })[] }` &mdash; A filter object to hand to `Banner.find`. It performs no query itself.

The looseness is deliberate and is what makes it safe to add these fields to
a collection that already had rows. `isActive` is tested with `$ne: false`,
so a document with no such field counts as on; each date is tested as
"null or past/future", so a document with no dates counts as unscheduled.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts#L121)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/Banner.ts)
