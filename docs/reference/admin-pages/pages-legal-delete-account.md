# DeleteAccountPage `DeleteAccount`

The public account-deletion instructions page.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/legal/DeleteAccount.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

Mounted at `/delete-account` in `router.tsx`. Like the privacy page it is
declared outside every layout guard, so it needs no sign-in; these legal
routes are the only unguarded ones in the admin web app. The URL is required
by app-store policy under data safety, and the privacy page links to it.

The page only explains the process. Deletion is handled by hand, by email or
in person — there is no form, no button and no endpoint behind it, so
nothing here calls the API.

It is still served through the SPA: `client/vercel.json` rewrites unmatched
paths to `/app.html`, so React boots before this static prose renders.

The copy is policy text. The stated windows — deletion within 7 days,
backups purged within 30 — and the list of what is removed must match
`pages/legal/Privacy.tsx` and what the shop actually does.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`DeleteAccountPage`](#component-delete-account-page) | React component | `function DeleteAccountPage(): Element` | Renders the deletion instructions, what is removed, and the timings. |

## Exports in detail

### `DeleteAccountPage` {#component-delete-account-page}

*React component · default export*

Renders the deletion instructions, what is removed, and the timings.

```ts
function DeleteAccountPage(): Element
```

Takes no props.

**Returns** `Element`

Takes no props, holds no state and makes no requests. The only interactive
elements are `mailto:` links built from `CONTACT_EMAIL`, so the whole flow
depends on that address being monitored.

The prose describes a manual process: the customer emails from the address
they signed in with, the shop verifies and deletes. It also describes
partial deletion the customer can do themselves in the mobile app — removing
a saved address, or removing items from a list before packing starts — so
the wording must match what the mobile app still allows.

Treat the 7-day and 30-day figures as commitments published to an app store,
and keep them identical to the privacy page.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/legal/DeleteAccount.tsx#L86)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/legal/DeleteAccount.tsx)
