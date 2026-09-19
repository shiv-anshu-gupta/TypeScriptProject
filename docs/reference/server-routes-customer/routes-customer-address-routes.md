# customerAddressRouter `address.routes`

A customer's delivery addresses, stored as sub-documents on their own user record.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/address.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, giving
`/customer/addresses` and `/customer/addresses/:addressId`.

Every route here requires a signed-in customer (`requireAuth` is applied
router-wide) and works only on the caller's own `users.addresses` array, so
one customer can never see or edit another's.

All four routes answer with the same thing: the caller's complete address
list, default first. None of them returns the single record that changed,
and the create returns 200 rather than 201.

Exactly one address is the default whenever the list is non-empty: the
first address added becomes the default automatically, promoting another
demotes the rest, and deleting the default hands the flag to the first
survivor.

No shipped client calls these routes; they belong to the cart-and-checkout
flow the apps no longer reach, but they are live on the server.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerAddressRouter`](#constant-customer-address-router) | Constant | `const customerAddressRouter: Router` | — |

## Exports in detail

### `customerAddressRouter` {#constant-customer-address-router}

*Constant*

```ts
const customerAddressRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/address.routes.ts#L71)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/address.routes.ts)
