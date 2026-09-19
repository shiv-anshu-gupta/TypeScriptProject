# AuthPanel

The login itself: Google, or an email and a six-digit code.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/auth/AuthPanel.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AuthPanel`](#component-auth-panel) | React component | `function AuthPanel(props: AuthPanelProps): Element` | Two steps in one panel: a Google button and an email box, then six boxes for the code that arrives by email. |

## Exports in detail

### `AuthPanel` {#component-auth-panel}

*React component*

Two steps in one panel: a Google button and an email box, then six boxes for
the code that arrives by email.

```ts
function AuthPanel(props: AuthPanelProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `grow?` | `boolean` | Push the consent line to the bottom of a full-height screen. |
| `onDone` | `() => void` | Called once the customer is signed in. Nothing is navigated from here; the caller decides. |
| `subtitle?` | `string` | Replaces the default line under the welcome title. |

**Returns** `Element`

The one door into an account, used wherever someone needs to log in: the
Account and Lists tabs show it straight away, and sending a list opens it
as its own screen. Google is the quickest; email works for everyone else
with a code instead of a password, so there's nothing to remember and no
separate "sign up" to find.

Whether an email signs in or signs up is decided by the server, never by the
customer: the panel tries to sign in, and only creates an account when Clerk
says that identifier does not exist. A new account is also asked for a name,
which the shop will see on every order.

It is mounted in three places at once — the Account tab, the Lists tab and
the SignIn screen — while Clerk keeps only one sign-in attempt per device.
Every effect here is therefore gated on `useIsFocused()`, and a hidden copy
left on the code step resets itself. Without that, a background copy would
take over the attempt another screen started and Resend would mail a
different address.

Finishing goes through `useSessionGuard`, the same path
[`GoogleAuthButton`](components-google-auth-button.md#component-google-auth-button) uses, so a session Clerk holds back as pending is
handled identically either way. Clerk's English-only error messages are
re-worded and translated for the common codes.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/auth/AuthPanel.tsx#L148)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/auth/AuthPanel.tsx)
