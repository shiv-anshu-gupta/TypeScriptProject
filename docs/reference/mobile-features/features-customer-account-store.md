# useCustomerAccountStore `store`

The customer's saved profile, shared by every screen that shows their name.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/account/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useCustomerAccountStore`](#hook-use-customer-account-store) | Hook | `const useCustomerAccountStore: UseBoundStore<StoreApi<CustomerAccountStore>>` | Holds the customer's saved profile, or `null` when it has not been loaded. |

## Exports in detail

### `useCustomerAccountStore` {#hook-use-customer-account-store}

*Hook*

Holds the customer's saved profile, or `null` when it has not been loaded.

```ts
const useCustomerAccountStore: UseBoundStore<StoreApi<CustomerAccountStore>>
```

Written by `loadProfile` at startup and on every visit to the Account
screen, and by `setProfile` after a successful edit — the profile sheet
puts the server's answer straight in rather than reloading.

Nothing is persisted. It is fetched at startup when Clerk says somebody is
signed in, and cleared on sign-out, which is what stops a shared phone
showing the previous customer's name.

A failed load is deliberately a no-op rather than a reset: screens keep
showing the name they have and fall back to the Clerk name until the next
load succeeds.

The invariant worth knowing is the ticket. Every load takes one, and
`clear()` takes one too, so a profile still in flight when the customer
signs out can never land afterwards and show the next person their name,
email and mobile number.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/store.ts#L49)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/store.ts)
