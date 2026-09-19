# Navigation types `types`

Route names and their parameters for both navigators.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/navigation/types.ts` |
| Group | [Mobile app — navigation](index.md) |
| Exports | 2 |

## Description

These two types are what makes `navigate()` and `route.params` type-safe
across the app, so a renamed route or a changed parameter surfaces as a
TypeScript error rather than a dead tap.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`RootStackParamList`](#type-root-stack-param-list) | Type | `type RootStackParamList = { … };` | The native stack: the tab host plus the screens that sit over it. |
| [`TabParamList`](#type-tab-param-list) | Type | `type TabParamList = { … };` | The four bottom tabs and the parameters each accepts. |

## Exports in detail

### `RootStackParamList` {#type-root-stack-param-list}

*Type*

The native stack: the tab host plus the screens that sit over it.

```ts
type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: { productId: string };
  Wishlist: undefined;
  SignIn: undefined;
  Legal: undefined;
};
```

| Property | Type | Meaning |
|---|---|---|
| `Legal` | `undefined` | — |
| `ProductDetails` | `{ productId: string }` | — |
| `SignIn` | `undefined` | — |
| `Tabs` | `NavigatorScreenParams<TabParamList> \| undefined` | — |
| `Wishlist` | `undefined` | — |

`ProductDetails` can be pushed on top of itself, because a related product
opens as a new page rather than replacing the current one.

**See also**

- [`TabParamList`](#type-tab-param-list) for the screens inside `Tabs`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/navigation/types.ts#L45)

### `TabParamList` {#type-tab-param-list}

*Type*

The four bottom tabs and the parameters each accepts.

```ts
type TabParamList = {
  Home: undefined;
  Shop: { category?: string; openSearch?: boolean; browseAll?: boolean } | undefined;
  Lists: { tab?: "active" | "completed" | "cancelled" } | undefined;
  Account: undefined;
};
```

| Property | Type | Meaning |
|---|---|---|
| `Account` | `undefined` | — |
| `Home` | `undefined` | — |
| `Lists` | `{ … } \| undefined` | — |
| `Shop` | `{ … } \| undefined` | — |

Parameters here are one-shot hand-offs, not state: the receiving screen
clears its own parameter once it has applied it, so tapping the same
shortcut on Home twice in a row works both times.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/navigation/types.ts#L22)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/navigation/types.ts)
