# Home types `types`

What the Home payload contains.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/home/types.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 6 |

## Description

The shop edits all of it in the admin panel, so every section can be empty
and a newer server can send fields this build has never heard of.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`BannerLink`](#type-banner-link) | Type | `type BannerLink = { type: "none" \| "writeList" \| "shop" } \| { type: "category" \| "product"; targetId: string };` | What a banner opens when tapped - chosen in the admin panel. |
| [`CustomerHomeBanner`](#type-customer-home-banner) | Type | `type CustomerHomeBanner = { … };` | One promotional image on Home. |
| [`CustomerHomeCategory`](#type-customer-home-category) | Type | `type CustomerHomeCategory = { … };` | One category tile. |
| [`CustomerHomeCoupon`](#type-customer-home-coupon) | Type | `type CustomerHomeCoupon = { … };` | A discount code the shop is advertising. |
| [`CustomerHomeProduct`](#type-customer-home-product) | Type | `type CustomerHomeProduct = { … };` | A product as Home shows it. |
| [`CustomerHomeResponse`](#type-customer-home-response) | Type | `type CustomerHomeResponse = { … };` | The body of `GET /customer/home`. |

## Exports in detail

### `BannerLink` {#type-banner-link}

*Type*

What a banner opens when tapped - chosen in the admin panel.

```ts
type BannerLink = { type: "none" | "writeList" | "shop" } | { type: "category" | "product"; targetId: string };
```

Only `category` and `product` carry a `targetId`, which is what makes this
a union rather than one type with an optional field.

A newer server can send a `type` this build does not implement. The
carousel checks before making a banner tappable, so an unknown link makes
the banner decorative rather than broken.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/types.ts#L22)

### `CustomerHomeBanner` {#type-customer-home-banner}

*Type*

One promotional image on Home.

```ts
type CustomerHomeBanner = {
  _id: string;
  imageUrl: string;
  title?: string;
  link?: BannerLink;
  createdAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `createdAt` | `string` | — |
| `imageUrl` | `string` | — |
| `link?` | `BannerLink` | — |
| `title?` | `string` | — |

`imageUrl` may point at an image that no longer exists. The carousel drops
a banner whose picture fails to load and tries again on the next fetch,
rather than leaving a grey rectangle.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/types.ts#L34)

### `CustomerHomeCategory` {#type-customer-home-category}

*Type*

One category tile.

```ts
type CustomerHomeCategory = {
  _id: string;
  name: string;
  imageUrl?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `imageUrl?` | `string` | — |
| `name` | `string` | — |

`_id` is what the Shop screen filters by, so it is the value handed over
when a tile is tapped — not the name.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/types.ts#L51)

### `CustomerHomeCoupon` {#type-customer-home-coupon}

*Type*

A discount code the shop is advertising.

```ts
type CustomerHomeCoupon = {
  _id: string;
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  endsAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `code` | `string` | — |
| `count` | `number` | — |
| `endsAt` | `string` | — |
| `minimumOrderValue` | `number` | — |
| `percentage` | `number` | — |

Carried in the payload but not currently shown anywhere — this app has no
checkout to apply a code at. The shop prices a list by hand.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/types.ts#L85)

### `CustomerHomeProduct` {#type-customer-home-product}

*Type*

A product as Home shows it.

```ts
type CustomerHomeProduct = {
  _id: string;
  title: string;
  brand: string;
  image: string;
  unit: string;
  unitValue?: number;
  createdAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `brand` | `string` | — |
| `createdAt` | `string` | — |
| `image` | `string` | — |
| `title` | `string` | — |
| `unit` | `string` | — |
| `unitValue?` | `number` | — |

Deliberately smaller than the catalogue's `CustomerProduct`: one image URL
rather than a gallery, and no description, stock or category. Enough for a
card; the details screen fetches the rest by id.

`unit` and `unitValue` are here because the card's "+" has to add a
sensible starting quantity to the draft without another request.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/types.ts#L68)

### `CustomerHomeResponse` {#type-customer-home-response}

*Type*

The body of `GET /customer/home`.

```ts
type CustomerHomeResponse = {
  banners: CustomerHomeBanner[];
  categories: CustomerHomeCategory[];
  recentProducts: CustomerHomeProduct[];
  coupons: CustomerHomeCoupon[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `banners` | `CustomerHomeBanner[]` | — |
| `categories` | `CustomerHomeCategory[]` | — |
| `coupons` | `CustomerHomeCoupon[]` | — |
| `recentProducts` | `CustomerHomeProduct[]` | — |

Every array can be empty, and the store's fallback is exactly that — so a
screen never has to check whether a section exists, only whether it has
anything in it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/types.ts#L102)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/types.ts)
