# GoogleAuthButton

The "Continue with Google" button.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/GoogleAuthButton.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`GoogleAuthButton`](#component-google-auth-button) | React component | `function GoogleAuthButton(props: GoogleAuthButtonProps): Element` | Signs the customer in with their Google account, opening Google's own page in a browser window over the app. |

## Exports in detail

### `GoogleAuthButton` {#component-google-auth-button}

*React component*

Signs the customer in with their Google account, opening Google's own page
in a browser window over the app.

```ts
function GoogleAuthButton(props: GoogleAuthButtonProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onDone` | `() => void` | Called only once there is a usable active session. The caller decides where to go next. |

**Returns** `Element`

Runs Clerk's SSO flow and warms the browser up first on Android, so the
window opens without a pause.

It finishes through the same `useSessionGuard` the email flow uses, so the
two paths can never answer the same situation differently — including a
session Clerk created but is holding back as pending, and a
`session_exists` failure from an earlier attempt.

Two outcomes are deliberately quiet rather than errors: Clerk not being
ready means nothing was attempted, and the customer closing the Google
window is not a failure.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GoogleAuthButton.tsx#L47)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GoogleAuthButton.tsx)
