# Code reference

Every exported symbol in the three TypeScript projects, one page per source file, with the descriptions taken from the TSDoc comments in the code itself.

## How this is generated

TypeDoc reads the source and writes a JSON model of it; `docs/tools/build-reference.mjs` turns that model into these pages. Nothing here is written by hand, and no description is invented: a symbol with no comment in the source is shown with an em dash and counted against its group's *carrying a description* figure.

```sh
cd server && npx typedoc --json ../docs/.typedoc/server.json
cd mobile && npx typedoc --json ../docs/.typedoc/mobile.json
cd client && npx typedoc --json ../docs/.typedoc/admin.json
node docs/tools/build-reference.mjs
```

## Groups

| Project | Group | Source folder | Files | Symbols | Described |
|---|---|---|---|---|---|
| Server | [Models](server-models/index.md) | `server/src/models/` | 10 | 47 | 47/47 |
| Server | [Routes: admin](server-routes-admin/index.md) | `server/src/routes/admin/` | 7 | 7 | 0/7 |
| Server | [Routes: customer](server-routes-customer/index.md) | `server/src/routes/` | 12 | 12 | 0/12 |
| Server | [Services](server-services/index.md) | `server/src/services/` | 2 | 5 | 5/5 |
| Server | [Utilities and middleware](server-support/index.md) | `server/src/` | 18 | 36 | 36/36 |
| Mobile app | [Screens](mobile-screens/index.md) | `mobile/src/screens/` | 10 | 10 | 10/10 |
| Mobile app | [Components](mobile-components/index.md) | `mobile/src/components/` | 27 | 38 | 33/38 |
| Mobile app | [Features and state](mobile-features/index.md) | `mobile/src/features/` | 31 | 97 | 96/97 |
| Mobile app | [Library](mobile-lib/index.md) | `mobile/src/lib/` | 16 | 37 | 36/37 |
| Mobile app | [Navigation](mobile-navigation/index.md) | `mobile/src/navigation/` | 4 | 5 | 5/5 |
| Admin panel | [Pages](admin-pages/index.md) | `client/src/pages/` | 14 | 13 | 12/13 |
| Admin panel | [Components](admin-components/index.md) | `client/src/components/` | 25 | 28 | 27/28 |
| Admin panel | [Features and hooks](admin-features/index.md) | `client/src/features/` | 27 | 102 | 94/102 |
| Admin panel | [Library](admin-lib/index.md) | `client/src/lib/` | 11 | 31 | 29/31 |

In total: 14 groups, 214 file pages, 468 exported symbols.

## Look a name up

| Index | What is in it |
|---|---|
| [All files](all-files.md) | Every source file with a page here. |
| [All functions](all-functions.md) | Plain functions and hooks. |
| [All components](all-components.md) | React components, mobile and web. |
| [All types](all-types.md) | Type aliases, interfaces, classes and enums. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
