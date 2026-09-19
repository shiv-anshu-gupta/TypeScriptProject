# AdminPushBell

The header control for browser push alerts.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/AdminPushBell.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminPushBell`](#component-admin-push-bell) | React component | `function AdminPushBell(): Element \| null` | Lets the shopkeeper switch on OS-level alerts for new orders. |

## Exports in detail

### `AdminPushBell` {#component-admin-push-bell}

*React component*

Lets the shopkeeper switch on OS-level alerts for new orders.

```ts
function AdminPushBell(): Element | null
```

Takes no props.

**Returns** `Element \| null`

Three states:

- Push unconfigured, or unsupported by the browser — renders `null`. This is
  the trap: a missing `VITE_FIREBASE_*` value makes the bell vanish from the
  header with no error and no explanation anywhere in the UI. If someone
  reports the bell missing in production, check the environment variables and
  redeploy, rather than looking for a bug here.
- Permission granted — a static "on" indicator. There is deliberately no way
  to switch alerts back off from this app; the browser owns that setting.
- Otherwise — a button that asks for permission. When permission was already
  denied the button stays visible with different hover text, because a denial
  can only be reversed in browser settings and pressing the button again
  will do nothing.

This bell is only about push, which reaches a closed or backgrounded tab. The
chime and toast that fire while the grocery-lists page is open are separate
and need no permission at all.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/AdminPushBell.tsx#L35)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/AdminPushBell.tsx)
