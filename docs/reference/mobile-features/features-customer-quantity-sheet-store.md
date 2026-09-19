# Quantity sheet store `store`

Which product the app's single quantity picker is asking about.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/quantity-sheet/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`QuantityTarget`](#type-quantity-target) | Type | `type QuantityTarget = { … };` | The product the picker is open for. |
| [`useQuantitySheetStore`](#hook-use-quantity-sheet-store) | Hook | `const useQuantitySheetStore: UseBoundStore<StoreApi<QuantitySheetStore>>` | Holds the product the root quantity picker is asking about, or `null` when it is closed. |

## Exports in detail

### `QuantityTarget` {#type-quantity-target}

*Type*

The product the picker is open for.

```ts
type QuantityTarget = {
  title: string;
  unit?: string;
  unitValue?: number;
};
```

| Property | Type | Meaning |
|---|---|---|
| `title` | `string` | — |
| `unit?` | `string` | — |
| `unitValue?` | `number` | — |

`title` is the product's name and also what goes onto the draft row, so the
picker needs nothing else to add an item — no id, no fetch.

`unit` and `unitValue` are what every rule in `quantity.ts` keys off.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/quantity-sheet/store.ts#L26)

### `useQuantitySheetStore` {#hook-use-quantity-sheet-store}

*Hook*

Holds the product the root quantity picker is asking about, or `null` when
it is closed.

```ts
const useQuantitySheetStore: UseBoundStore<StoreApi<QuantitySheetStore>>
```

Written by a product card's "+" and cleared when the picker closes. Not
persisted.

`target` doubles as the open/closed flag, which is why the host keeps its
own copy of the last title while the sheet slides away — reading `target`
during the animation would blank the heading mid-slide.

The reason this is a store at all is performance, and it is load-bearing: a
card must only ever call `open()`, never mount a sheet of its own. See the
comment above.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/quantity-sheet/store.ts#L54)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/quantity-sheet/store.ts)
