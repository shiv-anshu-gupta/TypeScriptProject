# Account api `api`

The customer's own details, as the shop sees them.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/account/api.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 4 |

## Description

Both endpoints need a bearer token and act on the signed-in customer; there
is no id in either URL.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`CustomerProfile`](#type-customer-profile) | Type | `type CustomerProfile = { … };` | The customer's own details as the SHOP sees them on their orders. |
| [`getCustomerProfile`](#function-get-customer-profile) | Function | `function getCustomerProfile(): Promise<CustomerProfile>` | `GET /customer/profile` — the signed-in customer's saved details. |
| [`updateCustomerProfile`](#function-update-customer-profile) | Function | `function updateCustomerProfile(body: UpdateCustomerProfileBody): Promise<CustomerProfile>` | `PATCH /customer/profile` — saves an edit. |
| [`UpdateCustomerProfileBody`](#type-update-customer-profile-body) | Type | `type UpdateCustomerProfileBody = { … };` | A partial profile edit. |

## Exports in detail

### `CustomerProfile` {#type-customer-profile}

*Type*

The customer's own details as the SHOP sees them on their orders.

```ts
type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `email` | `string` | — |
| `name` | `string` | — |
| `phone` | `string` | — |

Separate from the Clerk account, and the one that matters: this name and
mobile are what the shopkeeper reads on an order and rings if something is
unclear.

Every field is a string, never null — an unset phone is `""`. `email` is
read-only here; it comes from the sign-in and cannot be patched.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/api.ts#L24)

### `getCustomerProfile` {#function-get-customer-profile}

*Function*

`GET /customer/profile` — the signed-in customer's saved details.

```ts
function getCustomerProfile(): Promise<CustomerProfile>
```

**Returns** `Promise<CustomerProfile>` &mdash; The profile, with `""` for anything not yet filled in.

**Throws**

- Error When signed out, or the request fails.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/api.ts#L50)

### `updateCustomerProfile` {#function-update-customer-profile}

*Function*

`PATCH /customer/profile` — saves an edit.

```ts
function updateCustomerProfile(body: UpdateCustomerProfileBody): Promise<CustomerProfile>
```

| Parameter | Type | Meaning |
|---|---|---|
| `body` | `UpdateCustomerProfileBody` | — |

Fields of `body` (`UpdateCustomerProfileBody`):

| Field | Type | Meaning |
|---|---|---|
| `name?` | `string` | — |
| `phone?` | `string` | — |

**Returns** `Promise<CustomerProfile>` &mdash; The whole profile as saved, not just the changed fields, so the caller can put the answer straight into the store.

**Throws**

- Error When signed out, or the server rejects the number.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/api.ts#L61)

### `UpdateCustomerProfileBody` {#type-update-customer-profile-body}

*Type*

A partial profile edit.

```ts
type UpdateCustomerProfileBody = {
  name?: string;
  phone?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `name?` | `string` | — |
| `phone?` | `string` | — |

Both fields are optional, so the profile sheet can send only what changed.
A phone is allowed to be empty, but a non-empty one must be a valid Indian
mobile — the app checks with `isValidMobile` before sending, and the server
checks again.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/api.ts#L39)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/api.ts)
