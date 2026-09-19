# Draft list store `store`

The unsent grocery list — the piece of paper the whole app writes on.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/draft-list/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 6 |

## Description

This is the only state in the app that survives being killed, and the only
store that writes to AsyncStorage. Everything else is fetched again at
launch.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`countSendableRows`](#function-count-sendable-rows) | Function | `function countSendableRows(rows: DraftRow[]): number` | How many items the customer has written, by the one definition above. |
| [`DraftRow`](#type-draft-row) | Type | `type DraftRow = { … };` | One line on the paper. |
| [`isSendableRow`](#function-is-sendable-row) | Function | `function isSendableRow(row: DraftRow): boolean` | A line that will actually be SENT: the shop needs a name. |
| [`MAX_PHOTOS_PER_SCAN`](#constant-max-photos-per-scan) | Constant | `const MAX_PHOTOS_PER_SCAN: 3` | How many photos may be read in one go (kept in step with the server). |
| [`ScannedLine`](#type-scanned-line) | Type | `type ScannedLine = { … };` | One line read off a photo of the customer's handwritten list. |
| [`useDraftListStore`](#hook-use-draft-list-store) | Hook | `const useDraftListStore: UseBoundStore<StoreApi<DraftListStore>>` | Holds the unsent list: the rows, whether they have been read back from disk, and the counter that hands out row ids. |

## Exports in detail

### `countSendableRows` {#function-count-sendable-rows}

*Function*

How many items the customer has written, by the one definition above.

```ts
function countSendableRows(rows: DraftRow[]): number
```

| Parameter | Type | Meaning |
|---|---|---|
| `rows` | `DraftRow[]` | — |

**Returns** `number`

Every count the customer sees comes from here — the tab badge, the centre
button, the Shop sticky bar, the sheet header. Compute a count any other
way and two places will eventually disagree.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/store.ts#L93)

### `DraftRow` {#type-draft-row}

*Type*

One line on the paper.

```ts
type DraftRow = {
  id: number;
  name: string;
  quantity: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `id` | `number` | — |
| `name` | `string` | — |
| `quantity` | `string` | — |

`id` is stable for the life of a line and is what the editor keys on, so a
line keeps its keyboard focus while the list grows around it. It is not a
position: removing a line leaves a gap in the ids, and the number the
customer sees is the index, not this.

`name` and `quantity` are free text and may both be empty — that is a blank
line, not an invalid one. `quantity` is never parsed as a number except by
`addProduct`'s "+1" bump.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/store.ts#L49)

### `isSendableRow` {#function-is-sendable-row}

*Function*

A line that will actually be SENT: the shop needs a name. This is the one
definition behind every "how many items" count in the app - the tab badge,
the Home card, the sheet header and Send - so they can never disagree.

```ts
function isSendableRow(row: DraftRow): boolean
```

| Parameter | Type | Meaning |
|---|---|---|
| `row` | `DraftRow` | — |

Fields of `row` (`DraftRow`):

| Field | Type | Meaning |
|---|---|---|
| `id` | `number` | — |
| `name` | `string` | — |
| `quantity` | `string` | — |

**Returns** `boolean`

A quantity with no name is not sendable, which is why it is possible to see
a line with writing on it that the badge does not count.

It says nothing about whether the line is *acceptable*: the send flow also
requires at least two characters, mirroring the server. Do not use this as
the last check before a POST.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/store.ts#L81)

### `MAX_PHOTOS_PER_SCAN` {#constant-max-photos-per-scan}

*Constant*

How many photos may be read in one go (kept in step with the server).

```ts
const MAX_PHOTOS_PER_SCAN: 3
```

The server enforces the same ceiling, so raising it here alone makes the
upload fail rather than read more pages.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/store.ts#L168)

### `ScannedLine` {#type-scanned-line}

*Type*

One line read off a photo of the customer's handwritten list.

```ts
type ScannedLine = {
  name: string;
  quantity: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `name` | `string` | — |
| `quantity` | `string` | — |

A suggestion, not a fact. It becomes an ordinary editable line, because the
reader can misread a word and a wrong line means a wrong bill.

`quantity` is often empty — a handwritten list frequently names an item and
nothing else.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/store.ts#L156)

### `useDraftListStore` {#hook-use-draft-list-store}

*Hook*

Holds the unsent list: the rows, whether they have been read back from
disk, and the counter that hands out row ids.

```ts
const useDraftListStore: UseBoundStore<StoreApi<DraftListStore>>
```

Written from everywhere a customer can add to their list — the paper editor,
"add to list" on a product card, the quantity picker, the photo scan — and
cleared by the send flow once the list is on its way.

**Persisted.** The rows go to AsyncStorage under `draft_grocery_list_rows`,
debounced by half a second, and immediately whenever the app leaves the
foreground. `hydrated` and `nextId` are **not** persisted: `hydrated` is
about this process, and `nextId` is recomputed from the saved rows.

**Hydration** happens once, from the app root, and is deliberately not
gated on being signed in — a list written before signing in is still the
customer's list. It is also picky: saved rows are restored only if at least
one of them has writing on it, so an already-sent list or an old grown one
cannot carry a wall of blank lines into the new session. Until `hydrate()`
resolves the store holds eight blank rows, which is what the editor shows.

**The invariant behind every count** is `isSendableRow`: a row with a
non-empty name. The tab badge, the centre button, the Shop sticky bar, the
sheet header and Send all count with it, so they cannot disagree.

**The paper always ends in one blank line.** Every mutation runs the rows
through `withTrailingBlank`, so there is somewhere to write and no item
limit.

Nothing here talks to the network. Sending belongs to `useSendDraft`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/store.ts#L287)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/store.ts)
