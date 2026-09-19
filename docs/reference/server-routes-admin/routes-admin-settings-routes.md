# adminSettingsRouter `settings.routes`

Shop settings: the home-screen banner carousel.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/admin/settings.routes.ts` |
| Group | [Server — routes: admin](index.md) |
| Exports | 1 |

## Description

Mounted at `/admin` in `server/src/server.ts`, so the paths below are
`/admin/settings/banners*`. `requireAdmin` is applied to the whole router,
so every route needs a signed-in user whose `users` record has
`role: "admin"`; a signed-in customer gets 403, not 404.

The router owns the whole `banners` collection and the Cloudinary folder
`ecommerce-monster-video/banners` behind it. There is no per-banner GET:
every route, including the mutations, answers with the full list plus
`limit`, so the admin panel can replace its table outright after any change.

`limit` is `HOME_BANNER_LIMIT` — how many live banners the app's carousel
shows, not a cap on how many may be stored. The server never enforces it on
upload, so an admin can store more than the app will ever display.

Banner order is a dense `sortOrder` maintained by this router alone; see
`listBanners` for the one place it is repaired.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`adminSettingsRouter`](#constant-admin-settings-router) | Constant | `const adminSettingsRouter: Router` | — |

## Exports in detail

### `adminSettingsRouter` {#constant-admin-settings-router}

*Constant*

```ts
const adminSettingsRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/settings.routes.ts#L355)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/settings.routes.ts)
