# useCustomerHomeStore `store`

The Home payload, fetched once and refreshed on return.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/home/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useCustomerHomeStore`](#hook-use-customer-home-store) | Hook | `const useCustomerHomeStore: UseBoundStore<StoreApi<CustomerHomeStore>>` | Holds the Home payload and whether a first load is still running. |

## Exports in detail

### `useCustomerHomeStore` {#hook-use-customer-home-store}

*Hook*

Holds the Home payload and whether a first load is still running.

```ts
const useCustomerHomeStore: UseBoundStore<StoreApi<CustomerHomeStore>>
```

Written only by `loadHome`, which the Home screen calls on mount and again
on every focus. Nothing is persisted and nothing is cleared on sign-out —
the payload is the shop's, not the customer's, and Home is a public screen.

Two module-level guards shape its behaviour. `lastLoadedAt` makes a refresh
within a minute a no-op, so bouncing between tabs does not hammer the
server. `inFlight` shares one request between a cold start and a tab focus
that ask together.

`loading` is deliberately only about the *first* load. A refresh leaves the
current data and the spinner alone, so coming back to Home never flashes an
empty page.

A failed load keeps whatever is on screen; the next visit tries again.

`clear()` exists for completeness and is not on the sign-out path.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/store.ts#L64)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/store.ts)
