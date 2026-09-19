# GroceryListSheet

The list paper as a near-full-screen bottom sheet.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/GroceryListSheet.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`GroceryListSheet`](#component-grocery-list-sheet) | React component | `function GroceryListSheet(): Element` | The full page of paper the customer writes their list on, slid up over whatever screen they were on. |

## Exports in detail

### `GroceryListSheet` {#component-grocery-list-sheet}

*React component*

The full page of paper the customer writes their list on, slid up over
whatever screen they were on.

```ts
function GroceryListSheet(): Element
```

Takes no props.

**Returns** `Element`

The list sheet, opened by "Write list" and the centre tab button.

It is the shared `<Sheet>` now, so it is dragged down to close like every
other sheet, and the keyboard is handled there - it used to be ~120 lines
here, because Android edge-to-edge (the RN 0.81 default) no longer resizes
the window for the keypad. What stays here is only what is specific to
writing a list: Send pinned in the header, the paper filling the page with
blank lines, and keeping the line being typed in on screen.

Mounted once at the app root, not by any screen, and takes no props: it
opens and closes through `useGrocerySheetStore`, so the centre tab button,
a banner and the home journey card can all open it. It also reads the draft
store for the item count in its subtitle and to top the paper up with blank
lines once it knows how tall its viewport is.

Closing by any route — the ✕, the backdrop, a drag down, Android back —
dismisses the keyboard first.

Sending is not handled here. [`SendListButton`](components-send-list-button.md#component-send-list-button) owns it, along with the
phone prompt that opens as a second sheet on top of this one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryListSheet.tsx#L72)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryListSheet.tsx)
