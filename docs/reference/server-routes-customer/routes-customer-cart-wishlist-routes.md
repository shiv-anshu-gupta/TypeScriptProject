# customerCartWishlistRouter `cart-wishlist.routes`

The signed-in customer's own cart and wishlist.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/cart-wishlist.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, so the paths below are
`/customer/cart*` and `/customer/wishlist*`. `requireAuth` is applied to the
whole router, so every route needs a signed-in caller of any role; there is
no admin route here. Each handler resolves its own `users` record through
`getDbUserFromReq`, and the cart and wishlist are always the caller's own —
no route accepts a user id.

No shipped client reaches the cart routes. The web client's router has no
customer pages at all, and the mobile app calls only the wishlist pair; the
web cart feature folder still imports these endpoints but nothing routes to
it (`docs/API.md` § 7.2). They remain live and authenticated, so they are
still a real, reachable surface for anyone holding a session token.

Every handler answers with the whole cart or the whole wishlist rather than
the row it changed, so a client can replace its local state outright.

`POST /cart/items` and `POST /cart/sync` both carry defects recorded below;
they are documented, not fixed.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerCartWishlistRouter`](#constant-customer-cart-wishlist-router) | Constant | `const customerCartWishlistRouter: Router` | — |

## Exports in detail

### `customerCartWishlistRouter` {#constant-customer-cart-wishlist-router}

*Constant*

```ts
const customerCartWishlistRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/cart-wishlist.routes.ts#L38)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/cart-wishlist.routes.ts)
