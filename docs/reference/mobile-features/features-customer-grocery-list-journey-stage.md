# JourneyStage `journey-stage`

Where the customer is in their journey, as a single decision.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/grocery-list/journey-stage.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`JourneyStage`](#type-journey-stage) | Type | `type JourneyStage = { kind: "write" } \| { kind: "send"; count: number } \| { kind: "pricing"; list: CustomerGroceryList; others: number } \| { kind: "priced"; list: CustomerGroceryList; others: number } \| { kind: "packing"; list: CustomerGroceryList; others: number } \| { kind: "ready"; list: CustomerGroceryList; others: number };` | Where the customer is in the write -> send -> get price -> collect journey, so the Home card can show their real progress and point at the next step. |
| [`journeyStage`](#function-journey-stage) | Function | `function journeyStage(draftCount: number, lists: CustomerGroceryList[]): JourneyStage` | Decides which single stage the Home card should show. |

## Exports in detail

### `JourneyStage` {#type-journey-stage}

*Type*

Where the customer is in the write -> send -> get price -> collect journey,
so the Home card can show their real progress and point at the next step.
`others` counts the customer's other orders still in progress, so the card
can mention them without following them.

```ts
type JourneyStage = { kind: "write" } | { kind: "send"; count: number } | { kind: "pricing"; list: CustomerGroceryList; others: number } | { kind: "priced"; list: CustomerGroceryList; others: number } | { kind: "packing"; list: CustomerGroceryList; others: number } | { kind: "ready"; list: CustomerGroceryList; others: number };
```

A discriminated union on `kind`, so the card can switch on it and every
stage carries exactly what it needs — `write` and `send` have no list to
show, the rest do.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/journey-stage.ts#L20)

### `journeyStage` {#function-journey-stage}

*Function*

Decides which single stage the Home card should show.

```ts
function journeyStage(draftCount: number, lists: CustomerGroceryList[]): JourneyStage
```

| Parameter | Type | Meaning |
|---|---|---|
| `draftCount` | `number` | Sendable rows on the paper, counted with `countSendableRows`. |
| `lists` | `CustomerGroceryList[]` | Every list the customer has; completed and cancelled ones are filtered out here, so callers pass the lot. |

**Returns** `JourneyStage` &mdash; One stage. With no draft and no active order, `write`.

Pure decision, kept free of React so it can be reasoned about and tested on
its own.

Three rules, in order. An unsent draft always wins, because a list the
customer forgot to send never reaches the shop. Otherwise a `ready` order
leads, since that one needs the customer to walk to the shop. Otherwise the
newest order leads — not the one furthest along, so an old order left
unfinished cannot hide the list just sent.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/journey-stage.ts#L52)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/journey-stage.ts)
