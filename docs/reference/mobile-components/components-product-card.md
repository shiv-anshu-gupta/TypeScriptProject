# ProductCard

The product tile used in every grid in the app.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ProductCard.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProductCard`](#component-product-card) | React component | `function ProductCard(props: ProductCardProps): Element` | One product in a grid: its photo, brand, name and pack size, with a heart to save it and a "+" to put it on the list. |
| [`ProductCardData`](#type-product-card-data) | Type | `type ProductCardData = { … };` | The fields a card needs. |

## Exports in detail

### `ProductCard` {#component-product-card}

*React component*

One product in a grid: its photo, brand, name and pack size, with a heart to
save it and a "+" to put it on the list.

```ts
function ProductCard(props: ProductCardProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onPress?` | `(id: string) => void` | — |
| `product` | `ProductCardData` | — |

**Returns** `Element`

See [`ProductCard`](#component-product-card) for the memoised export every caller should use.

It subscribes to the wishlist store, but only to its own saved/not-saved
answer, and reads Clerk's session at press time rather than subscribing to
it. Both are about keeping a scrolling grid still.

The "+" does not add anything directly. It opens the app's single quantity
picker through `useQuantitySheetStore`; this card mounts no sheet, and a
card must never mount one.

The `expo-image` props here are load-bearing — read the comments on them
before changing any of them.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ProductCard.tsx#L204)

### `ProductCardData` {#type-product-card-data}

*Type*

The fields a card needs.

```ts
type ProductCardData = {
  id: string;
  title: string;
  brand: string;
  image: string;
  unit: string;
  unitValue?: number;
};
```

| Property | Type | Meaning |
|---|---|---|
| `brand` | `string` | — |
| `id` | `string` | — |
| `image` | `string` | — |
| `title` | `string` | — |
| `unit` | `string` | — |
| `unitValue?` | `number` | — |

Deliberately narrower than the full product type, so Home, Shop and the
wishlist can all feed the same card from differently shaped payloads.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ProductCard.tsx#L26)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ProductCard.tsx)
