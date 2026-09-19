# Promo types `types`

Types for admin promo codes.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/promo/types.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 3 |

## Description

Two shapes exist on purpose: `Promo` is what the server returns, with real
numbers, and `PromoFormValues` is what the dialog collects, with every field
a string. The form values are sent as-is; the server parses them.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminPromosResponse`](#type-admin-promos-response) | Type | `type AdminPromosResponse = { … };` | Payload of every promo endpoint. |
| [`Promo`](#type-promo) | Type | `type Promo = { … };` | One promo code as the server stores it. |
| [`PromoFormValues`](#type-promo-form-values) | Type | `type PromoFormValues = { … };` | The promo dialog's form state, and the request body sent to the server. |

## Exports in detail

### `AdminPromosResponse` {#type-admin-promos-response}

*Type*

Payload of every promo endpoint.

```ts
type AdminPromosResponse = {
  items: Promo[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `Promo[]` | — |

Read, create, update and delete all answer with the same shape — the full
list after the change — so the hook can replace its state from any of them.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/types.ts#L39)

### `Promo` {#type-promo}

*Type*

One promo code as the server stores it.

```ts
type Promo = {
  _id: string;
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: string;
  endsAt: string;
  createdAt?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `code` | `string` | — |
| `count` | `number` | — |
| `createdAt?` | `string` | — |
| `endsAt` | `string` | — |
| `minimumOrderValue` | `number` | — |
| `percentage` | `number` | — |
| `startsAt` | `string` | — |

`percentage` is a whole-number discount percentage, `count` the number of
redemptions allowed and `minimumOrderValue` a rupee threshold.
`startsAt` / `endsAt` are ISO strings. `createdAt` is optional because
nothing in this app relies on it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/types.ts#L21)

### `PromoFormValues` {#type-promo-form-values}

*Type*

The promo dialog's form state, and the request body sent to the server.

```ts
type PromoFormValues = {
  code: string;
  percentage: string;
  count: string;
  minimumOrderValue: string;
  startsAt: string;
  endsAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `code` | `string` | — |
| `count` | `string` | — |
| `endsAt` | `string` | — |
| `minimumOrderValue` | `string` | — |
| `percentage` | `string` | — |
| `startsAt` | `string` | — |

Every field is a string because it comes straight from an `<input>`:
`percentage`, `count` and `minimumOrderValue` are numeric text, `startsAt`
and `endsAt` are ISO strings converted from `datetime-local` on submit.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/types.ts#L51)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/types.ts)
