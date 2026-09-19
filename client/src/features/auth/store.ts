/**
 * The single source of truth for who is signed in and what they may do.
 *
 * @remarks
 * Written only by {@link useBootstrapAuth}; read by every route guard. Nothing
 * else should set it.
 *
 * It is plain in-memory zustand with no persistence, so a page reload starts
 * from `idle` and the bootstrap runs again.
 *
 * @packageDocumentation
 */
import { create } from "zustand";
import type { AppUser } from "@/lib/types";

/**
 * Where the bootstrap has got to.
 *
 * @remarks
 * `idle` before anything has run, `loading` while sync and me are in flight,
 * `ready` once the answer is known — including the answer "nobody is signed
 * in" — and `error` when the API could not be reached at all.
 *
 * `ready` therefore does not mean a user exists. Check `user` as well.
 */
type AuthStatus = "idle" | "loading" | "ready" | "error";

/**
 * The store's state and the four transitions allowed on it.
 */
type AuthStore = {
  /** See {@link AuthStatus}. */
  status: AuthStatus;
  /**
   * Whether the bootstrap has settled at least once.
   *
   * @remarks
   * Distinct from `status`, and the guards need both: this stays `true` for the
   * rest of the session once set, so a later re-check does not send a
   * signed-in user back through the loading screen.
   */
  isBootstrapped: boolean;
  /** The signed-in user, or `null` when signed out. Carries the `role`. */
  user: AppUser | null;
  /**
   * The failure message from a bootstrap that could not reach the API.
   *
   * @remarks
   * Shown under the "Couldn't reach the shop server" heading. A blocked CORS
   * origin arrives here as the opaque string `"Network Error"`.
   */
  error: string | null;

  /** Marks the bootstrap as in flight and clears any previous error. */
  setLoading: () => void;
  /** Records the signed-in user and marks the bootstrap settled. */
  setUser: (user: AppUser | null) => void;
  /**
   * Records a bootstrap failure.
   *
   * @remarks
   * Deliberately leaves `user` untouched rather than clearing it. Guards test
   * `status === "error"` before they test `user`, so the stale value is never
   * read.
   */
  setError: (message: string) => void;
  /** Records "signed out" — a settled, successful, empty result. */
  clearAuth: () => void;
};

/**
 * Hook and store holding the signed-in user and the bootstrap's progress.
 *
 * @remarks
 * Guards must wait for `isBootstrapped` before acting on `user`. Reading
 * `user === null` too early looks identical to being signed out and will
 * redirect a signed-in admin to the sign-in page.
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
