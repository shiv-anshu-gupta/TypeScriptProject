# getCustomerHomeDateOverview `api`

The one request the Home screen makes.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/home/api.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getCustomerHomeDateOverview`](#function-get-customer-home-date-overview) | Function | `function getCustomerHomeDateOverview(): Promise<CustomerHomeResponse>` | `GET /customer/home` — banners, categories, newest products and coupons in one payload. |

## Exports in detail

### `getCustomerHomeDateOverview` {#function-get-customer-home-date-overview}

*Function*

`GET /customer/home` — banners, categories, newest products and coupons in
one payload.

```ts
function getCustomerHomeDateOverview(): Promise<CustomerHomeResponse>
```

**Returns** `Promise<CustomerHomeResponse>` &mdash; The whole Home payload; any section can be empty.

**Throws**

- Error When the request fails. The store keeps what is on screen rather than showing the message.

Public: it needs no token and works signed out, which is what lets Home
render while Clerk is still loading. One request rather than four, because
Home shows all of it at once and a cheap phone on a slow connection should
make one round trip.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/api.ts#L24)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/home/api.ts)
