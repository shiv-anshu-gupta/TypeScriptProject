# ListProgressCard

Home's lead card: where the customer is in the list journey.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ListProgressCard.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ListProgressCard`](#component-list-progress-card) | React component | `function ListProgressCard(): Element` | The card at the top of Home telling the customer what to do next, with a four-step strip lit up to where they are. |

## Exports in detail

### `ListProgressCard` {#component-list-progress-card}

*React component*

The card at the top of Home telling the customer what to do next, with a
four-step strip lit up to where they are.

```ts
function ListProgressCard(): Element
```

Takes no props.

**Returns** `Element`

The Home screen's lead card: the customer's list journey, live. It shows
which step they are on - write, send, wait for the price, collect - and
tapping it goes where that next step happens. It carries no button of its
own: the centre tab button already opens the list.

The stage comes from `useListJourney`, which reads both the unsent draft and
the sent orders, so this card needs no props and is never stale. Every
stage produces a headline, an icon and a destination: writing and sending
open the list sheet, everything later goes to the Lists tab, always on the
Active status tab since the order it names is in progress.

When more orders are in progress it says so but still opens Lists, where all
of them are.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ListProgressCard.tsx#L136)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ListProgressCard.tsx)
