# AuthScreen

The login as a modal screen.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/AuthScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AuthScreen`](#component-auth-screen) | React component | `function AuthScreen(): Element` | The sign-in page, presented as a modal with its own close button. |

## Exports in detail

### `AuthScreen` {#component-auth-screen}

*React component*

The sign-in page, presented as a modal with its own close button.

```ts
function AuthScreen(): Element
```

Takes no props.

**Returns** `Element`

The login as its own screen - opened when a signed-out customer taps Send
(or anything else that needs an account), and closed once they're in.

A thin wrapper: [`AuthView`](../mobile-components/components-auth-auth-view.md#component-auth-view) with a close bar. Signing in belongs to
`AuthPanel` inside it, and this screen only goes back once it is done,
returning the customer to whatever they were trying to do. It draws its own
close bar because the stack gives this route no header.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/AuthScreen.tsx#L26)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/AuthScreen.tsx)
