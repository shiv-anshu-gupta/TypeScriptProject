/**
 * The app's only HTTP client: one axios instance, Clerk bearer tokens, and
 * envelope unwrapping.
 *
 * @remarks
 * Every feature module calls the server through the five helpers here. Nothing
 * else should create an axios instance or call `fetch` against the API, because
 * only this module attaches the auth token.
 *
 * Two behaviours are shared by all five helpers and are worth knowing:
 *
 * - They return the `data` field of the server's `{ status, data, errors }`
 *   envelope, so callers get the payload directly.
 * - They never resolve on failure. Any error — transport, HTTP status, or an
 *   envelope with `status: "error"` — is rethrown as a plain `Error` whose
 *   message is the server's first error message, ready to put in a toast.
 *
 * The one thing to watch is that a blocked CORS origin never reaches this code
 * as a recognisable error. The browser discards the response, axios reports
 * `"Network Error"`, and that opaque string is what the shopkeeper sees. If
 * someone reports that message, check the server's `CORS_ORIGINS` before
 * anything else.
 *
 * @packageDocumentation
 */
import axios, { type AxiosRequestConfig } from "axios";
import { env } from "./env";
import type { ApiEnvelope } from "./types";

/**
 * The installed token source, or `null` before the auth bootstrap has run.
 *
 * @remarks
 * Module-level rather than passed around, so feature code never has to know
 * about tokens.
 */
let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Registers the function that supplies a bearer token for each request.
 *
 * @remarks
 * Called once by `useBootstrapAuth`, which passes Clerk's `getToken`. Because
 * the getter is invoked per request rather than its result cached, Clerk can
 * refresh an expiring token and the next request picks it up.
 *
 * Until this is called — and whenever the getter returns `null` — requests go
 * out with no `Authorization` header, and any `/admin/*` route will answer 401.
 *
 * @param getter - Resolves to a token, or `null` when nobody is signed in.
 */
export function setApiTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

/**
 * The shared axios instance.
 *
 * @remarks
 * `withCredentials: false` is correct here: auth travels in the
 * `Authorization` header, not in cookies, so the server's CORS configuration
 * does not need to allow credentials.
 */
const api = axios.create({
  baseURL: env.backendUrl,
  withCredentials: false,
});

api.interceptors.request.use(async (config) => {
  if (!tokenGetter) return config;

  const token = await tokenGetter();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Reduces any thrown value to one message fit to show the shopkeeper.
 *
 * @remarks
 * Preference order: the server's first structured error message, then axios's
 * own message, then a generic fallback. The middle case is the one that
 * produces `"Network Error"` for a CORS or connectivity failure.
 *
 * @param error - Whatever was caught.
 * @returns A non-empty message string.
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
 * GET a URL and return the unwrapped payload.
 *
 * @typeParam T - The expected payload type.
 * @param url - Path relative to `env.backendUrl`.
 * @param config - Extra axios options, such as query params.
 * @returns The envelope's `data`.
 * @throws An `Error` carrying the server's message, or `"Network Error"` when
 * the response never arrived.
 */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  try {
    const response = await api.get<ApiEnvelope<T>>(url, config);

    if (response.data.status === "error" || !response.data.data) {
      throw new Error(response.data.errors?.[0]?.message || "Request failed");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMsg(error));
  }
}

/**
 * POST a body and return the unwrapped payload.
 *
 * @remarks
 * Pass a `FormData` body for multipart uploads (products, categories, banner
 * images) and let axios set the boundary — do not set `Content-Type` by hand.
 * JSON bodies are capped at 100 kB by the server.
 *
 * @typeParam TResponse - The expected payload type.
 * @typeParam TBody - The request body type.
 * @param url - Path relative to `env.backendUrl`.
 * @param body - JSON-serialisable value, or `FormData`.
 * @param config - Extra axios options.
 * @returns The envelope's `data`.
 * @throws An `Error` carrying the server's message.
 */
export async function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  try {
    const response = await api.post<ApiEnvelope<TResponse>>(url, body, config);
    if (response.data.status === "error" || !response.data.data) {
      throw new Error(response.data.errors?.[0]?.message || "Request failed");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMsg(error));
  }
}

/**
 * PUT a body and return the unwrapped payload.
 *
 * @remarks
 * Used for whole-resource replacement — updating a product, and reordering the
 * home banners.
 *
 * @typeParam TResponse - The expected payload type.
 * @typeParam TBody - The request body type.
 * @param url - Path relative to `env.backendUrl`.
 * @param body - JSON-serialisable value, or `FormData`.
 * @param config - Extra axios options.
 * @returns The envelope's `data`.
 * @throws An `Error` carrying the server's message.
 */
export async function apiPut<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  try {
    const response = await api.put<ApiEnvelope<TResponse>>(url, body, config);

    if (response.data.status === "error" || !response.data.data) {
      throw new Error(response.data.errors?.[0]?.message || "Request failed");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMsg(error));
  }
}

/**
 * PATCH a body and return the unwrapped payload.
 *
 * @remarks
 * The verb the grocery-lists screen uses for nearly everything: prices, status
 * steps, mark-paid, item edits and item availability. Those endpoints answer
 * with the whole refreshed list array rather than the changed record, which is
 * why that page replaces its state wholesale instead of patching rows.
 *
 * @typeParam TResponse - The expected payload type.
 * @typeParam TBody - The request body type.
 * @param url - Path relative to `env.backendUrl`.
 * @param body - JSON-serialisable value.
 * @param config - Extra axios options.
 * @returns The envelope's `data`.
 * @throws An `Error` carrying the server's message.
 */
export async function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  try {
    const response = await api.patch<ApiEnvelope<TResponse>>(url, body, config);

    if (response.data.status === "error" || !response.data.data) {
      throw new Error(response.data.errors?.[0]?.message || "Request failed");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMsg(error));
  }
}

/**
 * DELETE a URL and return the unwrapped payload.
 *
 * @remarks
 * Every caller puts a `window.confirm` in front of this, since none of the
 * deletions can be undone.
 *
 * @typeParam TResponse - The expected payload type.
 * @param url - Path relative to `env.backendUrl`.
 * @param config - Extra axios options.
 * @returns The envelope's `data`.
 * @throws An `Error` carrying the server's message — for example the refusal
 * to delete a category that still has products, which the category dialog
 * shows verbatim.
 */
export async function apiDelete<TResponse>(
  url: string,
  config?: AxiosRequestConfig,
) {
  try {
    const response = await api.delete<ApiEnvelope<TResponse>>(url, config);
    if (response.data.status === "error" || !response.data.data) {
      throw new Error(response.data.errors?.[0]?.message || "Request failed");
    }

    return response.data.data;
  } catch (error) {
    throw new Error(getErrorMsg(error));
  }
}
