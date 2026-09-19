# RootNavigator

The app's top-level native stack.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/navigation/RootNavigator.tsx` |
| Group | [Mobile app — navigation](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`RootNavigator`](#component-root-navigator) | React component | `function RootNavigator(): Element` | The navigator the customer is always inside: the tab bar, with product details, saved products, sign-in and the legal text pushed over it. |

## Exports in detail

### `RootNavigator` {#component-root-navigator}

*React component*

The navigator the customer is always inside: the tab bar, with product
details, saved products, sign-in and the legal text pushed over it.

```ts
function RootNavigator(): Element
```

Takes no props.

**Returns** `Element`

There is no route guard here. Every route is reachable signed out; the Lists
and Account screens decide for themselves to draw the login in place of
their content.

Header titles are read through `useTranslation`, so this component
re-renders — and the titles change — when the language does.

The bottom sheets are not screens and are not listed here. They are
portalled in from the app root and draw over whatever this navigator shows.

**See also**

- [`RootStackParamList`](navigation-types.md#type-root-stack-param-list) for the route parameters.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/navigation/RootNavigator.tsx#L35)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/navigation/RootNavigator.tsx)
