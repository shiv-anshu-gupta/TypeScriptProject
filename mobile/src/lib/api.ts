import axios, { type AxiosRequestConfig } from "axios";
import { env } from "./env";
import type { ApiEnvelope } from "./types";

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setApiTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

// A request that never settles shows a spinner for ever, so give every call
// an upper bound.
const REQUEST_TIMEOUT_MS = 20000;
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

// One place where a request is made and the server's envelope is unwrapped:
// every verb below is the same call with a different method.
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

export function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  return request<T>("get", url, undefined, config);
}

export function apiPost<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  return request<TResponse>("post", url, body, config);
}

export function apiPatch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  config?: AxiosRequestConfig,
) {
  return request<TResponse>("patch", url, body, config);
}

export function apiDelete<TResponse>(url: string, config?: AxiosRequestConfig) {
  return request<TResponse>("delete", url, undefined, config);
}
