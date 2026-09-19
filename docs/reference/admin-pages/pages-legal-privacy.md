# PrivacyPage `Privacy`

The public privacy policy and terms of use page.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/legal/Privacy.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

Mounted twice in `router.tsx`: at `/privacy` and, with the same component,
at `/terms`. Both URLs therefore render identical content — the terms are
the second half of this one page, not a separate document. Editing this file
changes both.

These legal routes are declared outside `PublicOnlyLayout`,
`ProtectedLayout` and `RoleGuardLayout`, so they are the only routes in the
admin web app with no authentication guard of any kind. `/privacy` is the
public URL the Google Play Console requires for the mobile app's listing.

The page is still part of the SPA. `client/vercel.json` rewrites every
unmatched path to `/app.html`, so visiting `/privacy` boots React and the
router before this prose appears, even though the page has no interactive
behaviour and makes no API calls.

The copy is policy text, not decoration. It must stay in step with what the
mobile app actually declares and does — the camera and gallery permissions,
the notification token, the third-party processors listed under "Who can see
your data", and the deletion timings, which must match
`pages/legal/DeleteAccount.tsx`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PrivacyPage`](#component-privacy-page) | React component | `function PrivacyPage(): Element` | Renders the full privacy policy followed by the terms of use. |

## Exports in detail

### `PrivacyPage` {#component-privacy-page}

*React component · default export*

Renders the full privacy policy followed by the terms of use.

```ts
function PrivacyPage(): Element
```

Takes no props.

**Returns** `Element`

Takes no props, holds no state and calls no API. Everything is static prose
apart from the three constants above.

The same component is the element for both `/privacy` and `/terms`, so the
two routes are indistinguishable to a visitor; there is no separate terms
page to update. It also links to `/delete-account` with a plain anchor, not
a router `Link`, so that link causes a full page load.

Treat the wording as compliance material: the "Photos of your list" and
"What we collect" sections describe the mobile app's camera, gallery and
notification permissions, and the "How long we keep it" section states the
7-day and 30-day deletion windows repeated on the delete-account page. If
the app's behaviour changes, this text has to change with it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/legal/Privacy.tsx#L96)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/legal/Privacy.tsx)
