# useCustomerGroceryListStore `store`

The customer's sent orders, and everything they can do to one.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/grocery-list/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useCustomerGroceryListStore`](#hook-use-customer-grocery-list-store) | Hook | `const useCustomerGroceryListStore: UseBoundStore<StoreApi<CustomerGroceryListStore>>` | Holds every list the customer has sent, plus what is needed to act on one. |

## Exports in detail

### `useCustomerGroceryListStore` {#hook-use-customer-grocery-list-store}

*Hook*

Holds every list the customer has sent, plus what is needed to act on one.

```ts
const useCustomerGroceryListStore: UseBoundStore<StoreApi<CustomerGroceryListStore>>
```

Holds `items`, `unseenCount`, `upi`, `customerPhone`, and three pieces of
busy state: `loading` for the list fetch, `submitting` for a send, and
`payingListId` for the one list whose pay button is working.

Written by `loadLists` at startup, on focus of the Lists and Account tabs,
and whenever a push notification arrives; and by the actions below.
`submitList` is called only through `useSendDraft`.

Nothing is persisted. It is fetched at startup when signed in and cleared
on sign-out — which, with the ticket, is what stops a shared phone showing
the previous customer's orders.

**A failed load is not "no orders".** Every catch keeps what is already on
screen. Emptying the store on a network error would make Home fall back to
"write a list" and the Lists tab claim nothing was ever sent.

**`customerPhone` has three states, not two.** `null` means not fetched
yet, `""` means the customer has none on file and should be asked, and
anything else is the number. The send flow depends on that distinction: it
loads the lists once purely to turn `null` into one of the other two.

`removeItem` replaces the whole list with the server's answer rather than
splicing locally, because removing a line changes the total.

`payViaUpi` opens the customer's UPI app and nothing more. There is no
callback and no confirmation; the shopkeeper marks the order paid when the
money lands.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/store.ts#L102)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/grocery-list/store.ts)
