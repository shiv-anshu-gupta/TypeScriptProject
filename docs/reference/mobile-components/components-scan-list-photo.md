# ScanListPhoto

The camera button that reads a handwritten list into the draft.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ScanListPhoto.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ScanListPhoto`](#component-scan-list-photo) | React component | `function ScanListPhoto(): Element` | A camera button beside Send that offers Camera or Gallery, then writes what the photo says onto the list as ordinary editable lines. |

## Exports in detail

### `ScanListPhoto` {#component-scan-list-photo}

*React component*

A camera button beside Send that offers Camera or Gallery, then writes what
the photo says onto the list as ordinary editable lines.

```ts
function ScanListPhoto(): Element
```

Takes no props.

**Returns** `Element`

The camera beside Send: photograph the paper instead of typing it out.

The photo is only a way of writing: it is sent up, read, and gone. What
comes back is TEXT, written onto the same paper as everything else, in
ordinary editable lines - so if the reader mistook a word, the customer
fixes it right there before the shop ever sees the list. Nothing about the
photo is kept, on the phone or on the server.

It is one icon on purpose: this sits in a row with Send, and the list
itself - the paper - is what the screen is for.

Takes no props and is rendered in two places, the list sheet header and the
Lists tab, both times next to Send. It writes into `useDraftListStore` via
`addScannedLines`, which only reports how many lines were new — items
already on the list are not duplicated.

At most `MAX_PHOTOS_PER_SCAN` photos go up in one read, a limit kept in step
with the server. It always asks the customer to check the result, because a
misread item becomes a wrong bill and this is the one free moment to fix it.
Server errors are shown as the server worded them, since it knows whether it
is busy, unconfigured, or simply could not read the page.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ScanListPhoto.tsx#L47)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ScanListPhoto.tsx)
