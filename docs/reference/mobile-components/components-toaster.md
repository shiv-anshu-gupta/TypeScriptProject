# Toaster

The host that draws queued toast messages.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/Toaster.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Toaster`](#component-toaster) | React component | `function Toaster(): Element \| null` | Brief messages stacked under the status bar — what was saved, what failed, what the shop just did. |

## Exports in detail

### `Toaster` {#component-toaster}

*React component*

Brief messages stacked under the status bar — what was saved, what failed,
what the shop just did.

```ts
function Toaster(): Element | null
```

Takes no props.

**Returns** `Element \| null`

Mounted once at the app root and takes no props. It renders
`useToastStore.toasts`; anything in the app, React or not, raises a message
through the `toast.*` helpers, which also dismiss it on a timer. This
component neither queues nor expires anything.

It is `pointerEvents="none"`, so a toast never steals a tap from the screen
under it, and it is mounted outside the sheet portal on purpose — a message
the customer must read should not be drawn behind an open sheet.

Renders nothing when there is nothing to say.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/Toaster.tsx#L41)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/Toaster.tsx)
