# Mobile app — screens

One page per screen the customer can be looking at.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `mobile/src/screens/` |
| Files | 10 |
| Exported symbols | 10 |
| Carrying a description | 10 of 10 symbols, 10 of 10 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/screens/AccountScreen.tsx`](screens-account-screen.md) | AccountScreen | The Account tab: identity, saved details, counters, settings, sign out. | 1 |
| [`src/screens/AuthScreen.tsx`](screens-auth-screen.md) | AuthScreen | The login as a modal screen. | 1 |
| [`src/screens/HomeScreen.tsx`](screens-home-screen.md) | HomeScreen | The Home tab. | 1 |
| [`src/screens/LanguagePicker.tsx`](screens-language-picker.md) | LanguagePicker | The first-launch language choice. | 1 |
| [`src/screens/LegalScreen.tsx`](screens-legal-screen.md) | LegalScreen | The privacy policy and terms, written into this file. | 1 |
| [`src/screens/MyListsScreen.tsx`](screens-my-lists-screen.md) | MyListsScreen | The Lists tab: sent orders and the unsent draft. | 1 |
| [`src/screens/ProductDetailsScreen.tsx`](screens-product-details-screen.md) | ProductDetailsScreen | The product page. | 1 |
| [`src/screens/ShopScreen.tsx`](screens-shop-screen.md) | ShopScreen | The Shop tab: the catalogue. | 1 |
| [`src/screens/SplashScreen.tsx`](screens-splash-screen.md) | SplashScreen | The launch screen. | 1 |
| [`src/screens/WishlistScreen.tsx`](screens-wishlist-screen.md) | WishlistScreen | The saved products screen. | 1 |

## Exported symbols

???+ info "All 10 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`AccountScreen`](screens-account-screen.md#component-account-screen) | React component | [`AccountScreen`](screens-account-screen.md) | Who the customer is, what the shop has on file for them, how many orders they have placed, and the app's settings. |
    | [`AuthScreen`](screens-auth-screen.md#component-auth-screen) | React component | [`AuthScreen`](screens-auth-screen.md) | The sign-in page, presented as a modal with its own close button. |
    | [`HomeScreen`](screens-home-screen.md#component-home-screen) | React component | [`HomeScreen`](screens-home-screen.md) | The landing page: where the customer is in their list journey, then the shop's banners, categories and newest products. |
    | [`LanguagePicker`](screens-language-picker.md#component-language-picker) | React component | [`LanguagePicker`](screens-language-picker.md) | A full-screen choice between हिंदी and English, asked once before the app is used. |
    | [`LegalScreen`](screens-legal-screen.md#component-legal-screen) | React component | [`LegalScreen`](screens-legal-screen.md) | The privacy policy and terms as one scrolling page, reached from Account and from the consent line under the login. |
    | [`MyListsScreen`](screens-my-lists-screen.md#component-my-lists-screen) | React component | [`MyListsScreen`](screens-my-lists-screen.md) | The customer's orders, split into Active, Completed and Cancelled, with their unsent draft at the top of the Active tab. |
    | [`ProductDetailsScreen`](screens-product-details-screen.md#component-product-details-screen) | React component | [`ProductDetailsScreen`](screens-product-details-screen.md) | One product in full: its gallery, stock, description, related products, and a bar pinned at the bottom to save it or add it to the list. |
    | [`ShopScreen`](screens-shop-screen.md#component-shop-screen) | React component | [`ShopScreen`](screens-shop-screen.md) | The catalogue: a category rail down the left and a two-column product grid, with a search box and a bar offering to send the list once it has items. |
    | [`SplashScreen`](screens-splash-screen.md#component-splash-screen) | React component | [`SplashScreen`](screens-splash-screen.md) | The first thing the customer sees: the logo over a faint pattern of kirana goods, with a progress bar underneath. |
    | [`WishlistScreen`](screens-wishlist-screen.md#component-wishlist-screen) | React component | [`WishlistScreen`](screens-wishlist-screen.md) | The products the customer has hearted, as a list they can open or remove from. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
