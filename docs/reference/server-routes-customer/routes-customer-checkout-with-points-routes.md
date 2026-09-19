# customerCheckoutWithPointsRouter `checkout-with-points.routes`

Paying for a catalogue order entirely from the loyalty points balance on the caller's `users` record, plus reading that balance.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/checkout-with-points.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, so the paths below are
`/customer/checkout/points` and `/customer/checkout/pay-with-points`.

`requireAuth` is applied to the whole router, so both routes need a
signed-in customer. Neither is public and neither is admin-only. Both work
only on the caller's own balance and cart.

Points are 1:1 with rupees: the order total in rupees is deducted from
`users.points` as it stands. There is no part payment — either the balance
covers the whole total or the call fails. No money and no Razorpay order is
involved, so the resulting order is written as already paid.

Points are earned by returning a delivered order, which credits the full
`totalAmount` back (`orders.routes.ts`). Nothing in this router grants
them.

`pay-with-points` repeats the pricing logic of
`checkout.routes.ts:create-session` line for line rather than sharing it,
so a change to the pricing or promo rules has to be made in both files.

No shipped client calls either route, but both are live and
`pay-with-points` mutates real stock and real balances.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerCheckoutWithPointsRouter`](#constant-customer-checkout-with-points-router) | Constant | `const customerCheckoutWithPointsRouter: Router` | — |

## Exports in detail

### `customerCheckoutWithPointsRouter` {#constant-customer-checkout-with-points-router}

*Constant*

```ts
const customerCheckoutWithPointsRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/checkout-with-points.routes.ts#L133)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/checkout-with-points.routes.ts)
