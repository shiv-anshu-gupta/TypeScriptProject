# CurvedCaption

Curved text that stays correctly shaped in complex scripts like Devanagari.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/CurvedCaption.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 2 |

## Description

SVG TextPath lays text out one codepoint at a time, which breaks shaping:
in लिस्ट the zero-width ि matra and the स्ट conjunct fall apart and ल/स
collide. Letter-spacing cannot fix that - it moves glyphs but never
reattaches a matra to its consonant.

So the text is split into aksharas (syllable clusters) instead. Each cluster
is a normal `<Text>`, shaped by the platform's own engine exactly as it would
be anywhere else in the app, then placed along the arc and rotated to it.
Spacing is added BETWEEN clusters, never inside one.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`CurvedCaption`](#component-curved-caption) | React component | `function CurvedCaption(props: CurvedCaptionProps): Element` | A short caption bent around a circle, used for the label under the tab bar's centre button. |
| [`splitClusters`](#function-split-clusters) | Function | `function splitClusters(text: string): string[]` | Splits text into aksharas — syllable clusters that must stay whole. |

## Exports in detail

### `CurvedCaption` {#component-curved-caption}

*React component*

A short caption bent around a circle, used for the label under the tab bar's
centre button.

```ts
function CurvedCaption(props: CurvedCaptionProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `color` | `string` | — |
| `cx` | `number` | Centre of the circle the text follows. |
| `cy` | `number` | — |
| `fontSize` | `number` | — |
| `gap` | `number` | Space between clusters, measured along the arc. |
| `radius` | `number` | Distance from that centre to each cluster's middle. |
| `text` | `string` | — |
| `wordGap` | `number` | Extra space added at each word break. |

**Returns** `Element`

Draws `text` along the lower half of a circle, reading left to right with the
tops of the letters toward the centre. Render it keyed by `text`, so a
language switch remounts it and the clusters are measured afresh.

It renders twice. The first pass lays the clusters out invisibly to learn
their real widths, because the spacing along the arc depends on them; the
second places each one. So it is briefly blank on first mount, and a caller
should not expect it to draw synchronously.

Absolutely positioned over its parent and `pointerEvents="none"`, so it
never takes a tap from the button it labels.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/CurvedCaption.tsx#L94)

### `splitClusters` {#function-split-clusters}

*Function*

Splits text into aksharas — syllable clusters that must stay whole.

```ts
function splitClusters(text: string): string[]
```

| Parameter | Type | Meaning |
|---|---|---|
| `text` | `string` | — |

**Returns** `string[]`

A mark joins the base before it, and a consonant after a virama joins the
conjunct. Spaces come back as their own cluster, which is what lets the
caller widen the word breaks without touching the spacing inside a word.

Latin text passes through as one cluster per character, so the same code
path works in both languages.

**Example**

```ts
splitClusters("लिस्ट लिखें"); // ["लि", "स्ट", " ", "लि", "खें"]
```

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/CurvedCaption.tsx#L43)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/CurvedCaption.tsx)
