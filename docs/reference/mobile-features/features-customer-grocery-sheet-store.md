# useGrocerySheetStore `store`

Whether the grocery-list sheet is showing.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/grocery-sheet/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useGrocerySheetStore`](#hook-use-grocery-sheet-store) | Hook | `const useGrocerySheetStore: UseBoundStore<StoreApi<GrocerySheetStore>>` | Holds one boolean: is the list sheet open. |

## Exports in detail

### `useGrocerySheetStore` {#hook-use-grocery-sheet-store}

*Hook*

Holds one boolean: is the list sheet open.

```ts
const useGrocerySheetStore: UseBoundStore<StoreApi<GrocerySheetStore>>
```

Written by the centre tab button, by Home's banners and journey card, and
by the send flow — which closes the sheet through `getState().close()`
rather than a hook, because it runs outside React's render.

Not persisted: a restart should not reopen a sheet.

Closing it before navigating on Android is not optional. The sheet is drawn
over the whole app there, so a screen pushed underneath looks like nothing
happened.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-sheet/store.ts#L35)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-sheet/store.ts)
