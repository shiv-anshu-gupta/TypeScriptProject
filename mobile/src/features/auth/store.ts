/**
 * What this server knows about the signed-in customer, and how far startup
 * has got.
 *
 * @remarks
 * This store is about the *account*, not the session. Clerk owns the session
 * and answers "is anybody signed in"; screens ask Clerk's `useAuth()` for
 * that. This store holds the record the sKirana server returned for them.
 *
 * @packageDocumentation
 */

import { create } from "zustand";
import type { AppUser } from "@/lib/types";

/**
 * How far the account fetch has got.
 *
 * @remarks
 * `"ready"` covers both outcomes of a finished startup — signed in with a
 * user, and signed out with `user` null. Use `user` to tell those apart, not
 * `status`.
 */
type AuthStatus = "idle" | "loading" | "ready" | "error";

type AuthStore = {
  status: AuthStatus;
  isBootstrapped: boolean;
  user: AppUser | null;
  error: string | null;

  setLoading: () => void;
  setUser: (user: AppUser | null) => void;
  setError: (message: string) => void;
  clearAuth: () => void;
};

/**
 * Holds the signed-in customer's server-side account.
 *
 * @remarks
 * Holds `status`, `isBootstrapped`, `user` and `error`. Written only by
 * `useBootstrapAuth`, which runs once at the root of the app; no screen sets
 * it. Screens read `user` and `isBootstrapped`.
 *
 * Nothing is persisted. The session is what survives a restart, in
 * SecureStore, and everything here is fetched again from it on the next
 * launch — so a signed-out customer cannot be left with the previous
 * customer's name in memory.
 *
 * The invariant that matters at startup: `isBootstrapped` becomes `true` on
 * every finished outcome, including a failed `/auth/sync`. A screen waiting
 * on it will therefore never wait for ever; a screen that wants to know
 * whether the fetch *succeeded* must check `error` as well.
 */
export const useAuthStore = create<AuthStore>((set) => ({
  status: "idle",
  isBootstrapped: false,
  user: null,
  error: null,
  setLoading: () =>
    set({
      status: "loading",
      error: null,
    }),
  setUser: (user) =>
    set({
      status: "ready",
      isBootstrapped: true,
      user,
      error: null,
    }),
  setError: (message) =>
    set({
      status: "error",
      isBootstrapped: true,
      error: message,
    }),
  clearAuth: () =>
    set({
      status: "ready",
      isBootstrapped: true,
      user: null,
      error: null,
    }),
}));
