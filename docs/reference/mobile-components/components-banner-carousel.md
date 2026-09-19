# BannerCarousel

The promo strip at the top of the Home screen.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/BannerCarousel.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`BannerCarousel`](#component-banner-carousel) | React component | `function BannerCarousel(props: { banners: CustomerHomeBanner[] }): Element \| null` | A swipeable row of promo pictures with page dots, which advances itself every few seconds. |

## Exports in detail

### `BannerCarousel` {#component-banner-carousel}

*React component*

A swipeable row of promo pictures with page dots, which advances itself
every few seconds.

```ts
function BannerCarousel(props: { banners: CustomerHomeBanner[] }): Element | null
```

| Prop | Type | Meaning |
|---|---|---|
| `banners` | `CustomerHomeBanner[]` | — |

**Returns** `Element \| null`

Promo banners from the admin panel (Home banners): the live ones, in the
order the shop set. The design lives in the artwork itself; a banner can
also open something when tapped - the list sheet, the Shop, a category or
a product - as chosen in the admin panel.

A banner only counts as tappable when this build understands its link type,
so a newer server sending an unknown type leaves a picture rather than a
dead button. Tapping can open the list sheet or navigate into the Shop tab
or a product page.

Autoplay stops while the Home tab is not focused, while a finger is on it,
and when the system asks for reduced motion. Banners whose image fails to
load are dropped rather than shown as a grey box, and the set of failures is
cleared whenever fresh banners arrive, so a weak connection does not hide a
banner permanently.

Renders nothing when there is nothing left to show.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/BannerCarousel.tsx#L67)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/BannerCarousel.tsx)
