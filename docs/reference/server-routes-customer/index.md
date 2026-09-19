# Server — routes: customer

The Express routers the mobile app calls, plus the auth routes that sit in front of them.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `server/src/routes/` |
| Files | 12 |
| Exported symbols | 12 |
| Carrying a description | 0 of 12 symbols, 12 of 12 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/routes/auth/auth.routes.ts`](routes-auth-auth-routes.md) | authRouter | Account routes: the MongoDB `users` record that sits behind a Clerk session. | 1 |
| [`src/routes/customer/address.routes.ts`](routes-customer-address-routes.md) | customerAddressRouter | A customer's delivery addresses, stored as sub-documents on their own user record. | 1 |
| [`src/routes/customer/cart-wishlist.routes.ts`](routes-customer-cart-wishlist-routes.md) | customerCartWishlistRouter | The signed-in customer's own cart and wishlist. | 1 |
| [`src/routes/customer/checkout-with-points.routes.ts`](routes-customer-checkout-with-points-routes.md) | customerCheckoutWithPointsRouter | Paying for a catalogue order entirely from the loyalty points balance on the caller's `users` record, plus reading that balance. | 1 |
| [`src/routes/customer/checkout.routes.ts`](routes-customer-checkout-routes.md) | customerCheckoutRouter | Card-and-UPI checkout for the product catalogue: turning the caller's cart into an `Order` with a Razorpay order behind it, then confirming payment. | 1 |
| [`src/routes/customer/grocery-list.routes.ts`](routes-customer-grocery-list-routes.md) | customerGroceryListRouter | Customer grocery-list routes: sending a handwritten shopping list to the shop, watching what the shop does with it, paying for it, and the chat attached to it. | 1 |
| [`src/routes/customer/home.routes.ts`](routes-customer-home-routes.md) | customerHomeRouter | The single payload behind the app's home screen. | 1 |
| [`src/routes/customer/orders.routes.ts`](routes-customer-orders-routes.md) | customerOrderRouter | A customer's own `Order` documents, and the return they can start on one. | 1 |
| [`src/routes/customer/product.routes.ts`](routes-customer-product-routes.md) | customerProductRouter | The public shop catalogue: categories, the product list and one product. | 1 |
| [`src/routes/customer/profile.routes.ts`](routes-customer-profile-routes.md) | customerProfileRouter | The customer's own name, email and mobile number. | 1 |
| [`src/routes/customer/promo.routes.ts`](routes-customer-promo-routes.md) | customerPromoRouter | Promo-code checking for customers. | 1 |
| [`src/routes/customer/push-token.routes.ts`](routes-customer-push-token-routes.md) | customerPushTokenRouter | Device registration for Expo push notifications sent to customers. | 1 |

## Exported symbols

???+ info "All 12 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`authRouter`](routes-auth-auth-routes.md#constant-auth-router) | Constant | [`auth.routes`](routes-auth-auth-routes.md) | — |
    | [`customerAddressRouter`](routes-customer-address-routes.md#constant-customer-address-router) | Constant | [`address.routes`](routes-customer-address-routes.md) | — |
    | [`customerCartWishlistRouter`](routes-customer-cart-wishlist-routes.md#constant-customer-cart-wishlist-router) | Constant | [`cart-wishlist.routes`](routes-customer-cart-wishlist-routes.md) | — |
    | [`customerCheckoutRouter`](routes-customer-checkout-routes.md#constant-customer-checkout-router) | Constant | [`checkout.routes`](routes-customer-checkout-routes.md) | — |
    | [`customerCheckoutWithPointsRouter`](routes-customer-checkout-with-points-routes.md#constant-customer-checkout-with-points-router) | Constant | [`checkout-with-points.routes`](routes-customer-checkout-with-points-routes.md) | — |
    | [`customerGroceryListRouter`](routes-customer-grocery-list-routes.md#constant-customer-grocery-list-router) | Constant | [`grocery-list.routes`](routes-customer-grocery-list-routes.md) | — |
    | [`customerHomeRouter`](routes-customer-home-routes.md#constant-customer-home-router) | Constant | [`home.routes`](routes-customer-home-routes.md) | — |
    | [`customerOrderRouter`](routes-customer-orders-routes.md#constant-customer-order-router) | Constant | [`orders.routes`](routes-customer-orders-routes.md) | — |
    | [`customerProductRouter`](routes-customer-product-routes.md#constant-customer-product-router) | Constant | [`product.routes`](routes-customer-product-routes.md) | — |
    | [`customerProfileRouter`](routes-customer-profile-routes.md#constant-customer-profile-router) | Constant | [`profile.routes`](routes-customer-profile-routes.md) | — |
    | [`customerPromoRouter`](routes-customer-promo-routes.md#constant-customer-promo-router) | Constant | [`promo.routes`](routes-customer-promo-routes.md) | — |
    | [`customerPushTokenRouter`](routes-customer-push-token-routes.md#constant-customer-push-token-router) | Constant | [`push-token.routes`](routes-customer-push-token-routes.md) | — |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
