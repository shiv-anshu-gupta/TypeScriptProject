# Server — models

The Mongoose schemas and the TypeScript shape of every document the app stores in MongoDB.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `server/src/models/` |
| Files | 10 |
| Exported symbols | 47 |
| Carrying a description | 47 of 47 symbols, 10 of 10 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/models/Banner.ts`](models-banner.md) | Banner | The promotional images across the top of the app's Home screen. | 8 |
| [`src/models/Cart.ts`](models-cart.md) | Cart | A customer's basket in the catalogue side of the shop. | 4 |
| [`src/models/Category.ts`](models-category.md) | Category | The shelves the catalogue is divided into. | 3 |
| [`src/models/GroceryList.ts`](models-grocery-list.md) | GroceryList | The shop's main order: a free-text grocery list, priced by hand. | 7 |
| [`src/models/Message.ts`](models-message.md) | Message | The conversation between a customer and the shop about one order. | 4 |
| [`src/models/Order.ts`](models-order.md) | Order | An order placed through the catalogue and cart, paid for up front. | 6 |
| [`src/models/Product.ts`](models-product.md) | Product | The shop's catalogue. | 7 |
| [`src/models/Promo.ts`](models-promo.md) | Promo | Discount codes for catalogue orders. | 3 |
| [`src/models/User.ts`](models-user.md) | User | The app's own record of a person, alongside their Clerk account. | 2 |
| [`src/models/Wishlist.ts`](models-wishlist.md) | Wishlist | Products a customer has saved for later. | 3 |

## Exported symbols

???+ info "All 47 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`Banner`](models-banner.md#constant-banner) | Constant | [`Banner`](models-banner.md) | The Banner model. |
    | [`BANNER_LINK_TYPES`](models-banner.md#constant-banner-link-types) | Constant | [`Banner`](models-banner.md) | What a banner opens when a customer taps it in the app. |
    | [`BannerDocument`](models-banner.md#type-banner-document) | Type | [`Banner`](models-banner.md) | A saved banner, as Mongoose hands it back. |
    | [`BannerItem`](models-banner.md#type-banner-item) | Type | [`Banner`](models-banner.md) | One banner. |
    | [`BannerLink`](models-banner.md#type-banner-link) | Type | [`Banner`](models-banner.md) | Where a tap on the banner goes. |
    | [`BannerLinkType`](models-banner.md#type-banner-link-type) | Type | [`Banner`](models-banner.md) | One of [`BANNER_LINK_TYPES`](models-banner.md#constant-banner-link-types). |
    | [`Cart`](models-cart.md#type-cart) | Type | [`Cart`](models-cart.md) | One customer's basket. |
    | [`Cart`](models-cart.md#variable-cart) | Variable | [`Cart`](models-cart.md) | The Cart model. |
    | [`CartDocument`](models-cart.md#type-cart-document) | Type | [`Cart`](models-cart.md) | A saved cart, as Mongoose hands it back. |
    | [`CartItem`](models-cart.md#type-cart-item) | Type | [`Cart`](models-cart.md) | One line in the basket. |
    | [`Category`](models-category.md#type-category) | Type | [`Category`](models-category.md) | One category. |
    | [`Category`](models-category.md#variable-category) | Variable | [`Category`](models-category.md) | The Category model. |
    | [`CategoryDocument`](models-category.md#type-category-document) | Type | [`Category`](models-category.md) | A saved category, as Mongoose hands it back. |
    | [`GroceryList`](models-grocery-list.md#type-grocery-list) | Type | [`GroceryList`](models-grocery-list.md) | One list. |
    | [`GroceryList`](models-grocery-list.md#variable-grocery-list) | Variable | [`GroceryList`](models-grocery-list.md) | The GroceryList model. |
    | [`GroceryListDocument`](models-grocery-list.md#type-grocery-list-document) | Type | [`GroceryList`](models-grocery-list.md) | A saved list, as Mongoose hands it back. |
    | [`GroceryListItem`](models-grocery-list.md#type-grocery-list-item) | Type | [`GroceryList`](models-grocery-list.md) | One line of the list. |
    | [`GroceryListPaymentMethod`](models-grocery-list.md#type-grocery-list-payment-method) | Type | [`GroceryList`](models-grocery-list.md) | How the customer chose to pay. |
    | [`GroceryListPaymentStatus`](models-grocery-list.md#type-grocery-list-payment-status) | Type | [`GroceryList`](models-grocery-list.md) | Whether the money has arrived. |
    | [`GroceryListStatus`](models-grocery-list.md#type-grocery-list-status) | Type | [`GroceryList`](models-grocery-list.md) | Where a list has got to. |
    | [`HOME_BANNER_LIMIT`](models-banner.md#constant-home-banner-limit) | Constant | [`Banner`](models-banner.md) | How many live banners the Home carousel shows. |
    | [`liveBannerFilter`](models-banner.md#function-live-banner-filter) | Function | [`Banner`](models-banner.md) | Banners the app should show right now: switched on and inside their window. |
    | [`Message`](models-message.md#type-message) | Type | [`Message`](models-message.md) | One message. |
    | [`Message`](models-message.md#variable-message) | Variable | [`Message`](models-message.md) | The Message model. |
    | [`MessageDocument`](models-message.md#type-message-document) | Type | [`Message`](models-message.md) | A saved message, as Mongoose hands it back. |
    | [`MessageSender`](models-message.md#type-message-sender) | Type | [`Message`](models-message.md) | Which side sent the message. |
    | [`Order`](models-order.md#type-order) | Type | [`Order`](models-order.md) | One order. |
    | [`Order`](models-order.md#variable-order) | Variable | [`Order`](models-order.md) | The Order model. |
    | [`OrderDocument`](models-order.md#type-order-document) | Type | [`Order`](models-order.md) | A saved order, as Mongoose hands it back. |
    | [`OrderItem`](models-order.md#type-order-item) | Type | [`Order`](models-order.md) | One line of an order. |
    | [`OrderStatus`](models-order.md#type-order-status) | Type | [`Order`](models-order.md) | Where the goods have got to. |
    | [`PaymentStatus`](models-order.md#type-payment-status) | Type | [`Order`](models-order.md) | Whether the money for an order arrived. |
    | [`Product`](models-product.md#type-product) | Type | [`Product`](models-product.md) | One product. |
    | [`Product`](models-product.md#variable-product) | Variable | [`Product`](models-product.md) | The Product model. |
    | [`ProductDocument`](models-product.md#type-product-document) | Type | [`Product`](models-product.md) | A saved product, as Mongoose hands it back. |
    | [`ProductImage`](models-product.md#type-product-image) | Type | [`Product`](models-product.md) | One picture of a product. |
    | [`ProductSize`](models-product.md#type-product-size) | Type | [`Product`](models-product.md) | Clothing sizes, for products that have them. |
    | [`ProductStatus`](models-product.md#type-product-status) | Type | [`Product`](models-product.md) | Whether a product is on sale. |
    | [`ProductUnit`](models-product.md#type-product-unit) | Type | [`Product`](models-product.md) | How a product is measured. |
    | [`Promo`](models-promo.md#type-promo) | Type | [`Promo`](models-promo.md) | One discount code. |
    | [`Promo`](models-promo.md#variable-promo) | Variable | [`Promo`](models-promo.md) | The Promo model. |
    | [`PromoDocument`](models-promo.md#type-promo-document) | Type | [`Promo`](models-promo.md) | A saved promo, as Mongoose hands it back. |
    | [`User`](models-user.md#constant-user) | Constant | [`User`](models-user.md) | The User model. |
    | [`UserRole`](models-user.md#type-user-role) | Type | [`User`](models-user.md) | What a person may do. |
    | [`Wishlist`](models-wishlist.md#type-wishlist) | Type | [`Wishlist`](models-wishlist.md) | One customer's saved products. |
    | [`Wishlist`](models-wishlist.md#variable-wishlist) | Variable | [`Wishlist`](models-wishlist.md) | The Wishlist model. |
    | [`WishlistDocument`](models-wishlist.md#type-wishlist-document) | Type | [`Wishlist`](models-wishlist.md) | A saved wishlist, as Mongoose hands it back. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
