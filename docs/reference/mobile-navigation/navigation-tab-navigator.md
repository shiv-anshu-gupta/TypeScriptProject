# TabNavigator

The bottom tab navigator: Home, Shop, Lists and Account.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/navigation/TabNavigator.tsx` |
| Group | [Mobile app — navigation](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`TabNavigator`](#component-tab-navigator) | React component | `function TabNavigator(): Element` | The four bottom tabs, drawn by the app's own tab bar rather than the default one. |

## Exports in detail

### `TabNavigator` {#component-tab-navigator}

*React component*

The four bottom tabs, drawn by the app's own tab bar rather than the
default one.

```ts
function TabNavigator(): Element
```

Takes no props.

**Returns** `Element`

Subscribes to two stores so the Lists tab can advertise itself: the unseen
count of sent orders, and the number of sendable rows in the unsent draft.
The badge shows unseen orders first and falls back to the draft count, since
news from the shop matters more than a reminder to send. A non-empty draft
also turns the icon red and starts it beating.

`freezeOnBlur` means a tab that is off screen stops re-rendering but stays
mounted, so its effects still run. That is why several screens guard their
work with `useIsFocused()` — a background tab must not mark orders seen or
take over the device's single Clerk sign-in attempt.

The bar itself is [`CustomTabBar`](../mobile-components/components-custom-tab-bar.md#component-custom-tab-bar), which handles its own safe-area
padding and owns the raised centre button that opens the list sheet. That
button is not a tab and has no route.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/navigation/TabNavigator.tsx#L118)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/navigation/TabNavigator.tsx)
