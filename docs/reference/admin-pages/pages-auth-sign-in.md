# SignInPage `Sign-in`

The `/sign-in/*` page.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/auth/Sign-in.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`SignInPage`](#component-sign-in-page) | React component | `function SignInPage(): Element` | Clerk's sign-in form inside the sKirana brand frame. |

## Exports in detail

### `SignInPage` {#component-sign-in-page}

*React component*

Clerk's sign-in form inside the sKirana brand frame.

```ts
function SignInPage(): Element
```

Takes no props.

**Returns** `Element`

All of the behaviour — credentials, OAuth, multi-factor, error messages — is
Clerk's. Nothing here is custom, and the form's look is configured centrally
in `lib/clerk-appearance.ts` rather than by props.

The route is `/sign-in/*` with a trailing wildcard because Clerk renders its
own sub-routes (factor selection, verification) beneath this path.

Sign-in does not by itself grant access to the panel. The account must also
carry the admin role, which the server assigns from `ADMIN_EMAILS`; a
non-admin who signs in successfully lands on `RoleGuardLayout`'s
"Admin access only" screen.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/auth/Sign-in.tsx#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/auth/Sign-in.tsx)
