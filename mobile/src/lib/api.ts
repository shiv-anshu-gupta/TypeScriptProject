/**
 * The app's one HTTP client: a single axios instance, a single `request()`
 * helper, and four verb wrappers over it.
 *
 * @remarks
 * Every call in the app goes through here, so three things hold everywhere.
 * The base URL is `env.backendUrl`. A Clerk bearer token is attached when one
 * can be obtained in time, and the request is sent without one when it cannot.
 * The server's `{ status, data, meta?, errors? }` envelope is unwrapped, so a
 * caller only ever handles the payload and only ever catches a plain `Error`.
 *
 * @see {@link ApiEnvelope}
 *
 * @packageDocumentation
 */
import axios, { type AxiosRequestConfig } from "axios";
import { env } from "./env";
import type { ApiEnvelope } from "./types";

let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Installs the function the request interceptor asks for a bearer token.
 *
 * @remarks
 * Called once at startup by `useBootstrapAuth`, which hands over Clerk's
 * `getToken`. Until then — and after a sign-out, when Clerk answers `null` —
 * requests go out unauthenticated. There is one getter for the whole app; a
 * second call replaces the first.
 *
 * @see {@link useBootstrapAuth}
 */
export function setApiTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

/**
 * Upper bound on a whole request, in milliseconds.
 *
 * @remarks
 * A request that never settles shows a spinner for ever, so give every call
 * an upper bound. A caller may raise it for one call through the axios
 * config: reading a photo of a list allows 60 s, because the server has to
 * call a vision model.
 */
const REQUEST_TIMEOUT_MS = 20000;

/**
 * Upper bound on waiting for a Clerk token, in milliseconds.
 *
 * @remarks
 * The interceptor races the installed getter against this timer, and on a
 * timeout or a throw continues **without** a token. That is deliberate: if
 * Clerk is slow or broken, the public screens (Home, Shop, the version check)
 * must still load, so the code gives up on the token, never on the request.
 * The consequence is that a request made in the first moments after launch
 * can legitimately reach the server unauthenticated.
 */
const TOKEN_TIMEOUT_MS = 8000;

const api = axios.create({
  baseURL: env.backendUrl,
  withCredentials: false,
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use(async (config) => {
  if (!tokenGetter) return config;

  // The token comes from Clerk, which waits until it has loaded. If Clerk is
  // slow or failed, public screens (Home, Shop, the update check) must still
  // load - so give up on the token rather than on the request.
  let token: string | null = null;
  try {
    token = await Promise.race([
      tokenGetter(),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS),
      ),
    ]);
  } catch (error) {
    console.warn("[api] continuing without an auth token", error);
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Reduces anything thrown by axios to a message worth showing.
 *
 * @remarks
 * Preference order: the server's first error message, then axios's own
 * message (a timeout or a network failure), then a generic sentence. The
 * result is English — screens that must speak the customer's language
 * translate before they call, or fall back to their own string.
 */
function getErrorMsg(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.errors?.[0]?.message ||
      error.message ||
      "Request failed"
    );
  }

  if (error instanceof Error) return error.message;

  return "Something went wrong!!! Please try again";
}

/**
 * Makes the request and unwraps the server's envelope.
 *
 * @remarks
 * One place where a request is made and the server's envelope is unwrapped:
 * every verb below is the same call with a different method.
 *
 * A response counts as a failure when `status` is `"error"` **or** when `data`
 * is falsy. The consequence is worth knowing before adding an endpoint: one
 * that legitimately answers with `null` data would be treated as an error
 * here.
 *
 * @returns The envelope's `data`, never the envelope.
 * @throws Error Always a plain `Error` — axios errors, HTTP failures and
 * error envelopes are all normalised by {@link getErrorMsg}, so no caller has
 * to know axios.
 */
async function request<T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  try {
    const response = await api.request<ApiEnvelope<T>>({
      ...config,
      method,
      url,
      ...(data !== undefined ? { data } : {}),
    });

    if (response.data.status === "error" || !response.data.data) {
      throw new Error(response.data.errors?.[0]?.message || "Request failed");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMsg(error));
  }
}

/**
 * GET, unwrapped.
 *
 * @param config - Per-call axios options; `timeout` overrides the 20 s default.
 * @returns The envelope's `data`.
 * @throws Error With the server's first error message where there is one.
 */
export function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  return request<T>("get", url, undefined, config);
}

/**
 * POST, unwrapped.
 *
 * @param body - Sent as JSON, or as `FormData` for a multipart upload.
 * @param config - Per-call axios options; `timeout` overrides the 20 s default.
 * @returns The envelope's `data`.
 * @throws Error With the server's first error message where there is one.
 */
export function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  return request<TResponse>("post", url, body, config);
}

/**
 * PATCH, unwrapped.
 *
 * @param body - Sent as JSON. Omit it for an endpoint that patches by URL
 * alone, such as marking a list seen.
 * @returns The envelope's `data`.
 * @throws Error With the server's first error message where there is one.
 */
export function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  return request<TResponse>("patch", url, body, config);
}

/**
 * DELETE, unwrapped.
 *
 * @param config - Per-call axios options. A body goes in `config.data`, which
 * is how the push-token endpoint receives its token.
 * @returns The envelope's `data`.
 * @throws Error With the server's first error message where there is one.
 */
export function apiDelete<TResponse>(url: string, config?: AxiosRequestConfig) {
  return request<TResponse>("delete", url, undefined, config);
}
