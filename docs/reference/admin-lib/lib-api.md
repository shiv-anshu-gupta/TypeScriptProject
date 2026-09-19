# Api `api`

The app's only HTTP client: one axios instance, Clerk bearer tokens, and envelope unwrapping.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/api.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 6 |

## Description

Every feature module calls the server through the five helpers here. Nothing
else should create an axios instance or call `fetch` against the API, because
only this module attaches the auth token.

Two behaviours are shared by all five helpers and are worth knowing:

- They return the `data` field of the server's `{ status, data, errors }`
  envelope, so callers get the payload directly.
- They never resolve on failure. Any error — transport, HTTP status, or an
  envelope with `status: "error"` — is rethrown as a plain `Error` whose
  message is the server's first error message, ready to put in a toast.

The one thing to watch is that a blocked CORS origin never reaches this code
as a recognisable error. The browser discards the response, axios reports
`"Network Error"`, and that opaque string is what the shopkeeper sees. If
someone reports that message, check the server's `CORS_ORIGINS` before
anything else.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`apiDelete`](#function-api-delete) | Function | `function apiDelete<TResponse>( … ): Promise<NonNullable<TResponse>>` | DELETE a URL and return the unwrapped payload. |
| [`apiGet`](#function-api-get) | Function | `function apiGet<T>(url: string, config?: AxiosRequestConfig<any>): Promise<NonNullable<T>>` | GET a URL and return the unwrapped payload. |
| [`apiPatch`](#function-api-patch) | Function | `function apiPatch<TResponse, TBody = unknown>( … ): Promise<NonNullable<TResponse>>` | PATCH a body and return the unwrapped payload. |
| [`apiPost`](#function-api-post) | Function | `function apiPost<TResponse, TBody = unknown>( … ): Promise<NonNullable<TResponse>>` | POST a body and return the unwrapped payload. |
| [`apiPut`](#function-api-put) | Function | `function apiPut<TResponse, TBody = unknown>( … ): Promise<NonNullable<TResponse>>` | PUT a body and return the unwrapped payload. |
| [`setApiTokenGetter`](#function-set-api-token-getter) | Function | `function setApiTokenGetter(getter: () => Promise<string \| null>): void` | Registers the function that supplies a bearer token for each request. |

## Exports in detail

### `apiDelete` {#function-api-delete}

*Function*

DELETE a URL and return the unwrapped payload.

```ts
function apiDelete<TResponse>(
  url: string,
  config?: AxiosRequestConfig<any>,
): Promise<NonNullable<TResponse>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | Path relative to `env.backendUrl`. |
| `config?` | `AxiosRequestConfig<any>` | Extra axios options. |

**Returns** `Promise<NonNullable<TResponse>>` &mdash; The envelope's `data`.

**Throws**

- An `Error` carrying the server's message — for example the refusal to delete a category that still has products, which the category dialog shows verbatim.

Every caller puts a `window.confirm` in front of this, since none of the
deletions can be undone.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/api.ts#L247)

### `apiGet` {#function-api-get}

*Function*

GET a URL and return the unwrapped payload.

```ts
function apiGet<T>(url: string, config?: AxiosRequestConfig<any>): Promise<NonNullable<T>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | Path relative to `env.backendUrl`. |
| `config?` | `AxiosRequestConfig<any>` | Extra axios options, such as query params. |

**Returns** `Promise<NonNullable<T>>` &mdash; The envelope's `data`.

**Throws**

- An `Error` carrying the server's message, or `"Network Error"` when the response never arrived.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/api.ts#L117)

### `apiPatch` {#function-api-patch}

*Function*

PATCH a body and return the unwrapped payload.

```ts
function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig<any>,
): Promise<NonNullable<TResponse>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | Path relative to `env.backendUrl`. |
| `body?` | `TBody` | JSON-serialisable value. |
| `config?` | `AxiosRequestConfig<any>` | Extra axios options. |

**Returns** `Promise<NonNullable<TResponse>>` &mdash; The envelope's `data`.

**Throws**

- An `Error` carrying the server's message.

The verb the grocery-lists screen uses for nearly everything: prices, status
steps, mark-paid, item edits and item availability. Those endpoints answer
with the whole refreshed list array rather than the changed record, which is
why that page replaces its state wholesale instead of patching rows.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/api.ts#L214)

### `apiPost` {#function-api-post}

*Function*

POST a body and return the unwrapped payload.

```ts
function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig<any>,
): Promise<NonNullable<TResponse>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | Path relative to `env.backendUrl`. |
| `body?` | `TBody` | JSON-serialisable value, or `FormData`. |
| `config?` | `AxiosRequestConfig<any>` | Extra axios options. |

**Returns** `Promise<NonNullable<TResponse>>` &mdash; The envelope's `data`.

**Throws**

- An `Error` carrying the server's message.

Pass a `FormData` body for multipart uploads (products, categories, banner
images) and let axios set the boundary — do not set `Content-Type` by hand.
JSON bodies are capped at 100 kB by the server.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/api.ts#L147)

### `apiPut` {#function-api-put}

*Function*

PUT a body and return the unwrapped payload.

```ts
function apiPut<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig<any>,
): Promise<NonNullable<TResponse>>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | Path relative to `env.backendUrl`. |
| `body?` | `TBody` | JSON-serialisable value, or `FormData`. |
| `config?` | `AxiosRequestConfig<any>` | Extra axios options. |

**Returns** `Promise<NonNullable<TResponse>>` &mdash; The envelope's `data`.

**Throws**

- An `Error` carrying the server's message.

Used for whole-resource replacement — updating a product, and reordering the
home banners.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/api.ts#L179)

### `setApiTokenGetter` {#function-set-api-token-getter}

*Function*

Registers the function that supplies a bearer token for each request.

```ts
function setApiTokenGetter(getter: () => Promise<string | null>): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `getter` | `() => Promise<string \| null>` | Resolves to a token, or `null` when nobody is signed in. |

Called once by `useBootstrapAuth`, which passes Clerk's `getToken`. Because
the getter is invoked per request rather than its result cached, Clerk can
refresh an expiring token and the next request picks it up.

Until this is called — and whenever the getter returns `null` — requests go
out with no `Authorization` header, and any `/admin/*` route will answer 401.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/api.ts#L52)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/api.ts)
