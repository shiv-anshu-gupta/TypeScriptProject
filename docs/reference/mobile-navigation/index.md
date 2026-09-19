# Mobile app — navigation

The navigators, the route parameter types, and the App entry point that mounts them.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `mobile/src/navigation/` |
| Files | 4 |
| Exported symbols | 5 |
| Carrying a description | 5 of 5 symbols, 4 of 4 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`App.tsx`](app.md) | App | The root of the app: the provider tree, the startup effects, and the two screens that sit outside the navigator. | 1 |
| [`src/navigation/RootNavigator.tsx`](navigation-root-navigator.md) | RootNavigator | The app's top-level native stack. | 1 |
| [`src/navigation/TabNavigator.tsx`](navigation-tab-navigator.md) | TabNavigator | The bottom tab navigator: Home, Shop, Lists and Account. | 1 |
| [`src/navigation/types.ts`](navigation-types.md) | Navigation types | Route names and their parameters for both navigators. | 2 |

## Exported symbols

???+ info "All 5 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`App`](app.md#component-app) | React component | [`App`](app.md) | Mounts the provider tree, and gates the first launch on a language. |
    | [`RootNavigator`](navigation-root-navigator.md#component-root-navigator) | React component | [`RootNavigator`](navigation-root-navigator.md) | The navigator the customer is always inside: the tab bar, with product details, saved products, sign-in and the legal text pushed over it. |
    | [`RootStackParamList`](navigation-types.md#type-root-stack-param-list) | Type | [`types`](navigation-types.md) | The native stack: the tab host plus the screens that sit over it. |
    | [`TabNavigator`](navigation-tab-navigator.md#component-tab-navigator) | React component | [`TabNavigator`](navigation-tab-navigator.md) | The four bottom tabs, drawn by the app's own tab bar rather than the default one. |
    | [`TabParamList`](navigation-types.md#type-tab-param-list) | Type | [`types`](navigation-types.md) | The four bottom tabs and the parameters each accepts. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
