# MyListsScreen

The Lists tab: sent orders and the unsent draft.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/MyListsScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`MyListsScreen`](#component-my-lists-screen) | React component | `function MyListsScreen(): Element` | The customer's orders, split into Active, Completed and Cancelled, with their unsent draft at the top of the Active tab. |

## Exports in detail

### `MyListsScreen` {#component-my-lists-screen}

*React component*

The customer's orders, split into Active, Completed and Cancelled, with
their unsent draft at the top of the Active tab.

```ts
function MyListsScreen(): Element
```

Takes no props.

**Returns** `Element`

Signed out it renders the login in place of its content — there is no route
guard anywhere in the app, each screen decides for itself.

Signed in, it reloads the orders on every focus and on pull-to-refresh, and
reads the draft store to know whether to show the draft card. Filtering
between the three status tabs is local; nothing is re-fetched.

It opens no sheet itself, but each order card mounts a chat sheet, and the
draft card carries the Send flow, which can open the phone prompt.

The `tab` parameter is a one-shot hand-off from Home's journey card or a
just-sent list, so the order being pointed at is actually on screen. It is
cleared once applied, leaving the customer free to switch tabs afterwards.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/MyListsScreen.tsx#L462)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/MyListsScreen.tsx)
