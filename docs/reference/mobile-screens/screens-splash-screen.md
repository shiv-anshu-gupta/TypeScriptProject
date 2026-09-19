# SplashScreen

The launch screen.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/SplashScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`SplashScreen`](#component-splash-screen) | React component | `function SplashScreen(props: SplashScreenProps): Element` | The first thing the customer sees: the logo over a faint pattern of kirana goods, with a progress bar underneath. |

## Exports in detail

### `SplashScreen` {#component-splash-screen}

*React component*

The first thing the customer sees: the logo over a faint pattern of kirana
goods, with a progress bar underneath.

```ts
function SplashScreen(props: SplashScreenProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `progress` | `number` | A percentage from 0 to 100. Values above 100 are clamped. |

**Returns** `Element`

Not a navigator screen. `App.tsx` renders it directly, on top of an app that
is already mounted and fetching, so Clerk, the home request and the
customer's orders all load behind it.

The progress is decorative. It is driven by a fake counter in `App.tsx` and
is not tied to any real loading, so this component must never be treated as
a signal that the app is ready.

Its text is deliberately not translated: it can appear before the stored
language has been read back.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/SplashScreen.tsx#L33)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/SplashScreen.tsx)
