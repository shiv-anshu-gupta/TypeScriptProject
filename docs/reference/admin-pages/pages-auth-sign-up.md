# SignUpPage `Sign-up`

The `/sign-up/*` page.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/auth/Sign-up.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`SignUpPage`](#component-sign-up-page) | React component | `function SignUpPage(): Element` | Clerk's sign-up form inside the sKirana brand frame. |

## Exports in detail

### `SignUpPage` {#component-sign-up-page}

*React component*

Clerk's sign-up form inside the sKirana brand frame.

```ts
function SignUpPage(): Element
```

Takes no props.

**Returns** `Element`

Signing up here creates an ordinary account, not an admin one. The server
grants the admin role only to addresses listed in its `ADMIN_EMAILS`
environment variable, so a new account made through this page will reach the
"Admin access only" screen unless its address is already on that list.

Note also that the server's sync promotes but never demotes: removing an
address from `ADMIN_EMAILS` does not take admin away from an existing record.

Customers should not be arriving here at all — they use the mobile app — which
is what the `AuthShell` footnote says.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/auth/Sign-up.tsx#L24)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/auth/Sign-up.tsx)
