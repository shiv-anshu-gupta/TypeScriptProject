# AuthView

The scrolling page that wraps the login panel.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/auth/AuthView.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AuthView`](#component-auth-view) | React component | `function AuthView(props: AuthViewProps): Element` | The login as a full page, scrolled so the field being typed in is never under the keyboard. |

## Exports in detail

### `AuthView` {#component-auth-view}

*React component*

The login as a full page, scrolled so the field being typed in is never
under the keyboard.

```ts
function AuthView(props: AuthViewProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `footer?` | `ReactNode` | Below the panel (e.g. settings). Hidden while typing so the field in use stays in view. Its presence also stops the panel from growing to fill the page. |
| `header?` | `ReactNode` | Above the panel: a close bar, or a tab's title. |
| `onDone` | `() => void` | — |
| `subtitle?` | `string` | — |

**Returns** `Element`

A scrolling page around the login panel that keeps whatever is being typed
above the keyboard - used as a full screen and inside the tabs.

It measures how far its own bottom sits above the bottom of the screen and
pads by the overlap, not by the keyboard's full height. Inside a tab,
padding the tab bar's height as well would scroll the active field off the
top. It also follows the content as it changes, because moving to the code
step keeps the keyboard up and so fires no new show event.

All the signing in belongs to [`AuthPanel`](components-auth-auth-panel.md#component-auth-panel); this component is layout.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/auth/AuthView.tsx#L48)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/auth/AuthView.tsx)
