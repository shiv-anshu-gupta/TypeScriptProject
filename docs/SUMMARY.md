<!-- Site navigation.

     Top level entries become tabs. The split is the one large reference sites
     use: something you read to understand, something you look things up in,
     and the material you need when it is three in the morning and the shop
     cannot take orders.

     Individual file and symbol pages are deliberately NOT listed here. There
     are several hundred of them; they are reached from the group tables, the
     A-Z indexes and search. -->

- [Home](index.md)
- Guide
    - How it works
        - [The system](explain/system.md)
        - [A list, from written to collected](explain/list-lifecycle.md)
        - [Signing in](explain/auth.md)
        - [One picture's journey](explain/images.md)
        - [Where customer data goes](explain/data-flow.md)
        - [The whole system, in depth](ARCHITECTURE.md)
    - How do I…
        - [Get it running](guides/getting-started.md)
        - [Add an endpoint](guides/add-an-endpoint.md)
        - [Add a field](guides/add-a-field.md)
        - [Add a screen](guides/add-a-screen.md)
        - [Release a change](guides/release.md)
- Modules
    - [All modules](modules/index.md)
    - [Grocery lists](modules/grocery-lists.md)
    - [Reading a photo](modules/photo-reading.md)
    - [Accounts and sign-in](modules/accounts-and-auth.md)
    - [Catalogue](modules/catalogue.md)
    - [Images](modules/images.md)
    - [Notifications](modules/notifications.md)
    - [Admin panel](modules/admin-panel.md)
    - [Mobile shell](modules/mobile-shell.md)
    - [Legacy e-commerce](modules/legacy-ecommerce.md)
    - [The mobile app, in depth](MOBILE-APP.md)
    - [The admin panel, in depth](ADMIN-WEB.md)
- Interfaces
    - API
        - [About the API](interfaces/api/index.md)
        - [Auth](interfaces/api/auth.md)
        - [Grocery lists — customer](interfaces/api/grocery-lists-customer.md)
        - [Grocery lists — shop](interfaces/api/grocery-lists-admin.md)
        - [Products — customer](interfaces/api/products-customer.md)
        - [Products — shop](interfaces/api/products-admin.md)
        - [Home](interfaces/api/home.md)
        - [Profile and addresses](interfaces/api/profile-and-addresses.md)
        - [Settings and banners](interfaces/api/settings-and-banners.md)
        - [Dashboard](interfaces/api/dashboard.md)
        - [Push tokens](interfaces/api/push-tokens.md)
        - [Legacy: cart, checkout, orders](interfaces/api/legacy-cart-checkout-orders.md)
        - [Every endpoint, in depth](API.md)
    - Database
        - [Schema overview](interfaces/database/index.md)
        - [users](interfaces/database/users.md)
        - [grocerylists](interfaces/database/grocery-lists.md)
        - [messages](interfaces/database/messages.md)
        - [products](interfaces/database/products.md)
        - [categories](interfaces/database/categories.md)
        - [banners](interfaces/database/banners.md)
        - [orders](interfaces/database/orders.md)
        - [carts](interfaces/database/carts.md)
        - [wishlists](interfaces/database/wishlists.md)
        - [promos](interfaces/database/promos.md)
        - [Every field and index, in depth](DATA-MODEL.md)
    - [Messages we send](interfaces/messages.md)
- Code reference
    - [About the code reference](reference/index.md)
    - Server
        - [Models](reference/server-models/index.md)
        - [Routes — customer](reference/server-routes-customer/index.md)
        - [Routes — shop](reference/server-routes-admin/index.md)
        - [Services](reference/server-services/index.md)
        - [Utilities and middleware](reference/server-support/index.md)
    - Mobile app
        - [Screens](reference/mobile-screens/index.md)
        - [Components](reference/mobile-components/index.md)
        - [Features and state](reference/mobile-features/index.md)
        - [Library](reference/mobile-lib/index.md)
        - [Navigation](reference/mobile-navigation/index.md)
    - Admin panel
        - [Pages](reference/admin-pages/index.md)
        - [Components](reference/admin-components/index.md)
        - [Features and hooks](reference/admin-features/index.md)
        - [Library](reference/admin-lib/index.md)
    - Look up a name
        - [All files](reference/all-files.md)
        - [All functions](reference/all-functions.md)
        - [All components](reference/all-components.md)
        - [All types](reference/all-types.md)
- Operations
    - [Runbook](operations/runbook.md)
    - [Configuration](operations/configuration.md)
    - [Limits](operations/limits.md)
    - [Monitoring](operations/monitoring.md)
    - [First-time setup](PRODUCTION-SETUP.md)
