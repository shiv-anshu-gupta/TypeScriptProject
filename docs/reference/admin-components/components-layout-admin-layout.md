# AdminLayout

The shell every admin page renders inside: sidebar, header, content area.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/layout/AdminLayout.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminLayout`](#component-admin-layout) | React component | `function AdminLayout(): Element` | Frames the admin pages with navigation and a sticky header. |

## Exports in detail

### `AdminLayout` {#component-admin-layout}

*React component*

Frames the admin pages with navigation and a sticky header.

```ts
function AdminLayout(): Element
```

Takes no props.

**Returns** `Element` &mdash; The layout with the matched admin page in its content area.

Mounted beneath both guards, so by the time this renders the user is signed
in and holds the admin role. It does no checking of its own.

Navigation appears in one of two forms depending on width. From the `lg`
breakpoint upwards the fixed 280px sidebar is shown; below it the sidebar is
hidden and the same nav list is served from a slide-over drawer behind the
menu button. Both render `AdminNavList`, so a new nav entry is added in one
place and appears in both. The drawer closes itself on a tap, since the
shopkeeper is usually on a phone behind the counter.

The header is sticky and holds the push bell and Clerk's account menu. The
bell renders nothing at all when Firebase is unconfigured, so an empty space
there is expected rather than a fault.

The only state kept here is whether the mobile drawer is open. It is not
persisted, so the drawer is always closed after a reload.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/layout/AdminLayout.tsx#L49)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/layout/AdminLayout.tsx)
