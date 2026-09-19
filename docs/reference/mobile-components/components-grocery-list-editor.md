# GroceryListEditor

The ruled paper the customer writes their grocery list on.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/GroceryListEditor.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 3 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`GroceryListEditor`](#component-grocery-list-editor) | React component | `function GroceryListEditor(props: GroceryListEditorProps): Element` | The list the customer types into: numbered lines with an item and a quantity, shown as a page of cream paper. |
| [`PAPER_HEADER_HEIGHT`](#constant-paper-header-height) | Constant | `const PAPER_HEADER_HEIGHT: 48` | The height of the paper's column header, in points. |
| [`ROW_HEIGHT`](#constant-row-height) | Constant | `const ROW_HEIGHT: 44` | The height of one written line, in points. |

## Exports in detail

### `GroceryListEditor` {#component-grocery-list-editor}

*React component*

The list the customer types into: numbered lines with an item and a
quantity, shown as a page of cream paper.

```ts
function GroceryListEditor(props: GroceryListEditorProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `autoFocusOnOpen?` | `boolean` | Put the cursor on the first empty line as soon as the editor appears, so the keyboard is already up and the customer can just start writing. It waits for a sheet's slide-in first. |
| `compact?` | `boolean` | Show only the written lines plus one blank line to continue on, instead of every blank line - for a summary card rather than a full page. |
| `onRowFocus?` | `(index: number) => void` | Called with a line's index when either of its fields gains focus, so a scrolling container can keep that line above the keyboard. |

**Returns** `Element`

The handwritten-style paper the customer writes their list on. It is a view
over the shared draft (the same one "Add to list" on products writes into),
so a line added from a product card appears here and vice versa.

Built for typing a whole list without touching the screen: the keyboard's
Next key goes item -> quantity -> next item, and a fresh line appears as the
last one fills, so the list never runs out of lines. The paper is the root
on purpose - the sheet's scroll-into-view maths assumes it starts at the top
of the scroll content.

Handlers read `useDraftListStore.getState()` rather than the render's rows,
because the list can grow between a keypress and its handler.

It renders no Send button and owns no sheet. Its two callers supply those:
`GroceryList` inline on the Lists tab, `GroceryListSheet` as a
full page.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryListEditor.tsx#L70)

### `PAPER_HEADER_HEIGHT` {#constant-paper-header-height}

*Constant*

The height of the paper's column header, in points.

```ts
const PAPER_HEADER_HEIGHT: 48
```

Exported for the same reason as [`ROW_HEIGHT`](#constant-row-height): the sheet offsets its
scroll maths by this header.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryListEditor.tsx#L32)

### `ROW_HEIGHT` {#constant-row-height}

*Constant*

The height of one written line, in points.

```ts
const ROW_HEIGHT: 44
```

Fixed geometry. The list sheet scrolls a focused line into view by its index,
and fills its page with lines, so these are the single source for both the
row styling and that maths - change a height here and it all stays correct.
Hard-coding the number in the sheet instead would silently break that maths.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryListEditor.tsx#L23)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryListEditor.tsx)
