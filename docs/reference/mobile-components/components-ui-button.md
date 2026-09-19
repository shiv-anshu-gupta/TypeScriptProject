# Button

The app's one button: five variants, three sizes, a built-in busy state.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ui/Button.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Button`](#component-button) | React component | `function Button(props: ButtonProps): Element` | A tappable button with a label, an optional leading icon and a spinner while the action it starts is still running. |

## Exports in detail

### `Button` {#component-button}

*React component*

A tappable button with a label, an optional leading icon and a spinner while
the action it starts is still running.

```ts
function Button(props: ButtonProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `className?` | `string` | — |
| `disabled?` | `boolean` | — |
| `icon?` | `ReactNode` | Drawn to the left of the label, and hidden while `loading`. |
| `label` | `string` | Already translated. This component does no `t()` lookup of its own. |
| `loading?` | `boolean` | — |
| `onPress?` | `() => void` | — |
| `size?` | `Size` | — |
| `textClassName?` | `string` | — |
| `variant?` | `Variant` | — |

**Returns** `Element`

`loading` also disables the button, so a caller does not have to set both to
stop a double tap. While loading the label and icon are replaced by a
spinner, not overlaid, so the button keeps its size but loses its text. The
spinner colour is chosen from the variant because `ActivityIndicator` takes a
colour value rather than a class.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Button.tsx#L62)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Button.tsx)
