# useListJourney `use-list-journey`

The journey decision, wired to live state.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/grocery-list/use-list-journey.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`JourneyStage`](#re-export-journey-stage) | Re-export | `export { JourneyStage };` | — |
| [`useListJourney`](#hook-use-list-journey) | Hook | `function useListJourney(): JourneyStage` | The customer's current journey stage, live from the draft and their orders. |

## Exports in detail

### `JourneyStage` {#re-export-journey-stage}

*Re-export*

```ts
export { JourneyStage };
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/use-list-journey.ts#L11)

### `useListJourney` {#hook-use-list-journey}

*Hook*

The customer's current journey stage, live from the draft and their orders.
The rule itself lives in journeyStage().

```ts
function useListJourney(): JourneyStage
```

**Returns** `JourneyStage`

Re-renders whenever the draft count or the list of orders changes, so the
Home card follows a list being typed without any refresh of its own.

It reads both stores but fetches nothing. A signed-out customer has no
orders loaded, so the answer comes from the draft alone.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/use-list-journey.ts#L24)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/use-list-journey.ts)
