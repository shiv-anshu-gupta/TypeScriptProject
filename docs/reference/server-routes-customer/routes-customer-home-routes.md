# customerHomeRouter `home.routes`

The single payload behind the app's home screen.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/home.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, giving the one route
`GET /customer/home`.

The route is public — no `requireAuth` — because the home screen is the
first thing the app draws, before Clerk has produced a token.

This is one of only two bounded reads in the API: eight banners, four
products and four coupons. Everything it returns is shaped by hand rather
than by the shared product and category mappers, so the keys here do not
match `/customer/products` or `/customer/categories`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerHomeRouter`](#constant-customer-home-router) | Constant | `const customerHomeRouter: Router` | — |

## Exports in detail

### `customerHomeRouter` {#constant-customer-home-router}

*Constant*

```ts
const customerHomeRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/home.routes.ts#L130)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/home.routes.ts)
