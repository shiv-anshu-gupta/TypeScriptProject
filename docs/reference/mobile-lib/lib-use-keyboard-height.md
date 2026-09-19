# useKeyboardHeight `use-keyboard-height`

How much of the screen the on-screen keyboard is covering.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/use-keyboard-height.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useKeyboardHeight`](#hook-use-keyboard-height) | Hook | `function useKeyboardHeight(): number` | The on-screen keyboard's height, or 0 while it's closed. |

## Exports in detail

### `useKeyboardHeight` {#hook-use-keyboard-height}

*Hook*

The on-screen keyboard's height, or 0 while it's closed.

```ts
function useKeyboardHeight(): number
```

**Returns** `number`

On Android (edge-to-edge) the window doesn't shrink for the keyboard, so a
screen that must keep a field visible pads its own bottom by this. RN
reports that height minus the navigation bar, hence adding the inset back.
The correction is self-cancelling: without edge-to-edge the inset is 0.

iOS uses the `will` events so padding animates with the keyboard; Android
only fires the `did` events reliably, so it moves in one step.

Re-renders the calling component on every keyboard change, so call it in
the component that does the padding, not in a common ancestor.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/use-keyboard-height.ts#L26)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/use-keyboard-height.ts)
