# Promo api `api`

Server calls for admin promo codes.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/promo/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 4 |

## Description

Thin wrappers over the helpers in `client/src/lib/api.ts`, which attach the
Clerk bearer token, unwrap the `{ status, data, errors }` envelope and throw
`errors[0].message` on failure. Callers therefore receive the payload
directly and must catch to handle an error.

Every route here answers with the full refreshed promo list, not just the
changed record, so `useAdminPromos` replaces its state wholesale after
each mutation. Requests carry JSON, not form-data.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`createAdminPromo`](#function-create-admin-promo) | Function | `function createAdminPromo(body: PromoFormValues): Promise<AdminPromosResponse>` | Creates a promo code. |
| [`deleteAdminPromo`](#function-delete-admin-promo) | Function | `function deleteAdminPromo(promoId: string): Promise<AdminPromosResponse>` | Deletes one promo code. |
| [`getAdminPromos`](#function-get-admin-promos) | Function | `function getAdminPromos(): Promise<AdminPromosResponse>` | Fetches every promo code. |
| [`updateAdminPromo`](#function-update-admin-promo) | Function | `function updateAdminPromo(promoId: string, body: PromoFormValues): Promise<AdminPromosResponse>` | Updates one promo code. |

## Exports in detail

### `createAdminPromo` {#function-create-admin-promo}

*Function*

Creates a promo code.

```ts
function createAdminPromo(body: PromoFormValues): Promise<AdminPromosResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `body` | `PromoFormValues` | Values collected by `PromoDialog`. |

Fields of `body` (`PromoFormValues`):

| Field | Type | Meaning |
|---|---|---|
| `code` | `string` | — |
| `count` | `string` | — |
| `endsAt` | `string` | — |
| `minimumOrderValue` | `string` | — |
| `percentage` | `string` | — |
| `startsAt` | `string` | — |

**Returns** `Promise<AdminPromosResponse>` &mdash; The full refreshed list, which replaces client state.

**Throws**

- Error carrying the server's message, for example on a duplicate code.

`POST /admin/promos`. The body is `PromoFormValues`, so numbers arrive as
strings and dates as ISO strings; parsing and validation are the server's
job.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/api.ts#L48)

### `deleteAdminPromo` {#function-delete-admin-promo}

*Function*

Deletes one promo code.

```ts
function deleteAdminPromo(promoId: string): Promise<AdminPromosResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `promoId` | `string` | The promo's `_id`. |

**Returns** `Promise<AdminPromosResponse>` &mdash; The full refreshed list.

**Throws**

- Error carrying the server's message.

`DELETE /admin/promos/:id`. The `window.confirm` prompt is in
`useAdminPromos`, not here — this call deletes unconditionally.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/api.ts#L81)

### `getAdminPromos` {#function-get-admin-promos}

*Function*

Fetches every promo code.

```ts
function getAdminPromos(): Promise<AdminPromosResponse>
```

**Returns** `Promise<AdminPromosResponse>` &mdash; The response envelope's payload, `{ items: Promo[] }`.

**Throws**

- Error carrying the server's first error message, or the axios message (for example the opaque `"Network Error"` that a blocked CORS origin produces).

`GET /admin/promos`. Called once on mount by `useAdminPromos`; there is
no polling.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/api.ts#L32)

### `updateAdminPromo` {#function-update-admin-promo}

*Function*

Updates one promo code.

```ts
function updateAdminPromo(promoId: string, body: PromoFormValues): Promise<AdminPromosResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `promoId` | `string` | The promo's `_id`. |
| `body` | `PromoFormValues` | — |

**Returns** `Promise<AdminPromosResponse>` &mdash; The full refreshed list.

**Throws**

- Error carrying the server's message.

`PATCH /admin/promos/:id`. Despite being a PATCH, the dialog always sends all
six fields.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/api.ts#L63)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/api.ts)
