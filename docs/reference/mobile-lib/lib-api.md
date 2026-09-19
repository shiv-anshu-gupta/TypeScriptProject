# Api `api`

The app's one HTTP client: a single axios instance, a single `request()` helper, and four verb wrappers over it.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/api.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 5 |

## Description

Every call in the app goes through here, so three things hold everywhere.
The base URL is `env.backendUrl`. A Clerk bearer token is attached when one
can be obtained in time, and the request is sent without one when it cannot.
The server's `{ status, data, meta?, errors? }` envelope is unwrapped, so a
caller only ever handles the payload and only ever catches a plain `Error`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`apiDelete`](#function-api-delete) | Function | `function apiDelete<TResponse>( … ): Promise<NonNullable<TResponse>>` | DELETE, unwrapped. |
| [`apiGet`](#function-api-get) | Function | `function apiGet<T>(url: string, config?: AxiosRequestConfig<any>): Promise<NonNullable<T>>` | GET, unwrapped. |
| [`apiPatch`](#function-api-patch) | Function | `function apiPatch<TResponse, TBody = unknown>( … ): Promise<NonNullable<TResponse>>` | PATCH, unwrapped. |
| [`apiPost`](#function-api-post) | Function | `function apiPost<TResponse, TBody = unknown>( … ): Promise<NonNullable<TResponse>>` | POST, unwrapped. |
| [`setApiTokenGetter`](#function-set-api-token-getter) | Function | `function setApiTokenGetter(getter: () => Promise<string \| null>): void` | Installs the function the request interceptor asks for a bearer token. |

## Exports in detail

### `apiDelete` {#function-api-delete}

*Function*

DELETE, unwrapped.

```ts
function apiDelete<TResponse>(
  url: string,
  config?: AxiosRequestConfig<any>,
): Promise<NonNullable<TResponse>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | — |
| `config?` | `AxiosRequestConfig<any>` | Per-call axios options. A body goes in `config.data`, which is how the push-token endpoint receives its token. |

**Returns** `Promise<NonNullable<TResponse>>` &mdash; The envelope's `data`.

**Throws**

- Error With the server's first error message where there is one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/api.ts#L208)

### `apiGet` {#function-api-get}

*Function*

GET, unwrapped.

```ts
function apiGet<T>(url: string, config?: AxiosRequestConfig<any>): Promise<NonNullable<T>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | — |
| `config?` | `AxiosRequestConfig<any>` | Per-call axios options; `timeout` overrides the 20 s default. |

**Returns** `Promise<NonNullable<T>>` &mdash; The envelope's `data`.

**Throws**

- Error With the server's first error message where there is one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/api.ts#L164)

### `apiPatch` {#function-api-patch}

*Function*

PATCH, unwrapped.

```ts
function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig<any>,
): Promise<NonNullable<TResponse>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | — |
| `body?` | `TBody` | Sent as JSON. Omit it for an endpoint that patches by URL alone, such as marking a list seen. |
| `config?` | `AxiosRequestConfig<any>` | — |

**Returns** `Promise<NonNullable<TResponse>>` &mdash; The envelope's `data`.

**Throws**

- Error With the server's first error message where there is one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/api.ts#L192)

### `apiPost` {#function-api-post}

*Function*

POST, unwrapped.

```ts
function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig<any>,
): Promise<NonNullable<TResponse>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | — |
| `body?` | `TBody` | Sent as JSON, or as `FormData` for a multipart upload. |
| `config?` | `AxiosRequestConfig<any>` | Per-call axios options; `timeout` overrides the 20 s default. |

**Returns** `Promise<NonNullable<TResponse>>` &mdash; The envelope's `data`.

**Throws**

- Error With the server's first error message where there is one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/api.ts#L176)

### `setApiTokenGetter` {#function-set-api-token-getter}

*Function*

Installs the function the request interceptor asks for a bearer token.

```ts
function setApiTokenGetter(getter: () => Promise<string | null>): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `getter` | `() => Promise<string \| null>` | — |

Called once at startup by `useBootstrapAuth`, which hands over Clerk's
`getToken`. Until then — and after a sign-out, when Clerk answers `null` —
requests go out unauthenticated. There is one getter for the whole app; a
second call replaces the first.

**See also**

- `useBootstrapAuth`

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/api.ts#L33)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/api.ts)
