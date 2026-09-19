# AuthShell

The brand frame around the Clerk sign-in and sign-up forms.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/auth/AuthShell.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Purely presentational. It holds no auth logic of its own — Clerk's own
`<SignIn>` and `<SignUp>` components are passed in as children.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AuthShell`](#component-auth-shell) | React component | `function AuthShell(props: { children: ReactNode }): Element` | Wraps a Clerk auth form in the sKirana brand frame. |

## Exports in detail

### `AuthShell` {#component-auth-shell}

*React component*

Wraps a Clerk auth form in the sKirana brand frame.

```ts
function AuthShell(props: { children: ReactNode }): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `children` | `ReactNode` | The Clerk `<SignIn>` or `<SignUp>` form to frame. |

**Returns** `Element`

The teal brand panel appears only from the `lg` breakpoint upwards. Below
that it is hidden and a compact logo is shown above the form instead, so the
page still identifies itself on a phone.

Both "home" links here point at `/`, which is the static marketing homepage
served by Vercel before any rewrite — not a route in this router. That is
intentional: the footnote tells customers they are in the wrong place, and
these links are their way out.

Colours are literal hex values rather than theme tokens because this screen
sits outside the admin theme.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/AuthShell.tsx#L46)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/AuthShell.tsx)
