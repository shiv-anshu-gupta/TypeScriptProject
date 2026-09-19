# CustomTabBar

The bottom bar: four tabs and the raised button that opens the list.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/CustomTabBar.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`CustomTabBar`](#component-custom-tab-bar) | React component | `function CustomTabBar(props: BottomTabBarProps): Element` | The bar along the bottom of every tab screen, cradling a large round button that opens the grocery list. |

## Exports in detail

### `CustomTabBar` {#component-custom-tab-bar}

*React component*

The bar along the bottom of every tab screen, cradling a large round button
that opens the grocery list.

```ts
function CustomTabBar(props: BottomTabBarProps): Element
```

| Parameter | Type | Meaning |
|---|---|---|
| `props` | `BottomTabBarProps` | — |

**Returns** `Element`

A bottom tab bar whose top edge sweeps up and around a large circular button
in the middle.

The curve is an SVG elliptical-arc command. This cannot be done with
border-radius: a cradle needs the arc to ease back into the straight edge,
and a CSS arc always meets that edge at a visible kink. Drawing the whole bar
as one path also means the outline is continuous, with no seam where the
curve joins the line.

The centre button is not a tab and has no route. It opens the list sheet
through `useGrocerySheetStore`, and carries a badge of unsent items read
from the draft store — the same count the Lists tab badges itself with, so
the two can never disagree.

Its caption is drawn one of two ways. Latin goes through SVG `TextPath`;
Devanagari cannot, so [`CurvedCaption`](components-curved-caption.md#component-curved-caption) places whole syllables along the
arc instead.

Tab presses go through `navigation.emit` first, so a screen can intercept
its own tab press. It handles its own safe-area padding, which is why the
navigator passes no inset.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/CustomTabBar.tsx#L81)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/CustomTabBar.tsx)
