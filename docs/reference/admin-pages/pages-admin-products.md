# AdminProducts `Products`

The `/admin/products` screen — the shop's catalogue for the mobile app's Shop tab.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/admin/Products.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

Routed at `/admin/products` behind `ProtectedLayout` and
`RoleGuardLayout allow={["admin"]}` (`client/src/router.tsx`).

This file is layout only. All state and every request live in
`useAdminProducts`; the two dialogs own their own save and delete calls.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminProducts`](#component-admin-products) | React component | `function AdminProducts(): Element` | Renders the products card — toolbar plus table — and mounts both dialogs. |

## Exports in detail

### `AdminProducts` {#component-admin-products}

*React component · default export*

Renders the products card — toolbar plus table — and mounts both dialogs.

```ts
function AdminProducts(): Element
```

Takes no props.

**Returns** `Element`

Composition only: it reads everything from `useAdminProducts` and passes it
down. Typing in the toolbar sets `search`, which the hook debounces by
250 ms before re-issuing `GET /admin/products?search=`. Both dialogs are
always mounted and toggled by their `open` prop.

Both dialogs get `refreshAll` as `onSaved`, so any save or delete refetches
the products and the categories together. Nothing here updates
optimistically and there is no polling.

The product dialog's `onOpenChange` routes a close through
`closeProductDialog` so `editingProduct` is cleared — without that, the next
"Add Product" would open on the last edited row.

The default export is what `router.tsx` imports.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Products.tsx#L51)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Products.tsx)
