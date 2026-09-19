# Sidebar `sidebar`

The admin navigation: its item list and the three pieces that render it.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/common/sidebar.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 4 |

## Description

[`adminNavItems`](#constant-admin-nav-items) here and `router.tsx` are separate lists and neither
checks the other. A route added to the router without an entry here is
reachable only by typing the URL — which is exactly the state the dead
`/admin/orders` page is in.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminBrand`](#component-admin-brand) | React component | `function AdminBrand(): Element` | The shop name and icon. |
| [`adminNavItems`](#constant-admin-nav-items) | Constant | `const adminNavItems: AdminNavItem[]` | The navigation entries, in display order. |
| [`AdminNavList`](#component-admin-nav-list) | React component | `function AdminNavList(props: { onNavigate?: () => void }): Element` | Renders [`adminNavItems`](#constant-admin-nav-items) as router links, highlighting the current page. |
| [`AdminSidebar`](#component-admin-sidebar) | React component | `function AdminSidebar(): Element` | The fixed 280px sidebar, shown only from the `lg` breakpoint upwards. |

## Exports in detail

### `AdminBrand` {#component-admin-brand}

*React component*

The shop name and icon.

```ts
function AdminBrand(): Element
```

Takes no props.

**Returns** `Element`

Rendered three times: at the top of the desktop sidebar, at the top of the
mobile drawer, and in the mobile header. Unlike the sign-in screen's logo it
is not a link — there is nowhere useful to go from inside the panel.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/common/sidebar.tsx#L84)

### `adminNavItems` {#constant-admin-nav-items}

*Constant*

The navigation entries, in display order.

```ts
const adminNavItems: AdminNavItem[]
```

The order is deliberate and should not be re-sorted alphabetically. Grocery
lists is first because it is the screen the shop uses all day, which is also
why `/admin` redirects straight to it rather than to the dashboard.

Two labels do not match their targets, which is worth knowing before
searching for either:

- "Coupons" points at `/admin/coupons`, whose page heading reads "Promos".
- "Home banners" points at `/admin/settings`, and controls the picture strip
  in the mobile app rather than any setting of this web app.

There is no entry for `/admin/orders`. That page still exists on disk but is
not routed, and it should stay off this list.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/common/sidebar.tsx#L54)

### `AdminNavList` {#component-admin-nav-list}

*React component*

Renders [`adminNavItems`](#constant-admin-nav-items) as router links, highlighting the current page.

```ts
function AdminNavList(props: { onNavigate?: () => void }): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onNavigate?` | `() => void` | Called after a link is tapped. The mobile drawer passes its own close function here; the desktop sidebar passes nothing, since it is always visible. |

**Returns** `Element`

Shared by the desktop sidebar and the mobile drawer, so both always show the
same entries.

`NavLink` marks an entry active on prefix match, which would light up every
entry when the path is `/admin`. The `end` flag on that one entry restricts
it to an exact match. No current entry actually uses `/admin` as its `href`,
so the condition is inert today but guards a future top-level entry.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/common/sidebar.tsx#L110)

### `AdminSidebar` {#component-admin-sidebar}

*React component*

The fixed 280px sidebar, shown only from the `lg` breakpoint upwards.

```ts
function AdminSidebar(): Element
```

Takes no props.

**Returns** `Element`

Hidden entirely below `lg` by its own class, not by the layout, so nothing
needs to be conditionally mounted. Below that width `AdminLayout` puts the
same nav list inside a drawer instead.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/common/sidebar.tsx#L142)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/common/sidebar.tsx)
