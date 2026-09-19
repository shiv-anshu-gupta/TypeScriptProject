# Products constants `constants`

Fixed option lists used by the admin products screens.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/products/constants.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 2 |

## Description

Only [`UNIT_OPTIONS`](#constant-unit-options) is live. [`SIZE_OPTIONS`](#constant-size-options) is a leftover from
the shop's cloth-selling era and is kept purely so the dead customer pages
still compile.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`SIZE_OPTIONS`](#constant-size-options) | Constant | `const SIZE_OPTIONS: readonly ["S", "M", "L", "XL"]` | Garment sizes. |
| [`UNIT_OPTIONS`](#constant-unit-options) | Constant | `const UNIT_OPTIONS: ProductUnit[]` | The units a shopkeeper can pick in the product dialog. |

## Exports in detail

### `SIZE_OPTIONS` {#constant-size-options}

*Constant*

Garment sizes. Dead code, kept only to satisfy the compiler.

```ts
const SIZE_OPTIONS: readonly ["S", "M", "L", "XL"]
```

A leftover from when the shop sold cloth. No admin screen reads it: the only
importers are the customer web pages under `client/src/pages/customer/` and
`client/src/components/customer/`, and `router.tsx` renders none of those.
Grocery products have a unit, not a size. Delete this together with those
pages.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/constants.ts#L47)

### `UNIT_OPTIONS` {#constant-unit-options}

*Constant*

The units a shopkeeper can pick in the product dialog.

```ts
const UNIT_OPTIONS: ProductUnit[]
```

Rendered as the unit `Select` in `product-dialog.tsx`, paired with the free
`unitValue` number (10 + `kg` for a 10 kg bag).

The server validates against its own enum, so adding a value here without
adding it to the backend Product model produces a 400 on save.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/constants.ts#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/constants.ts)
