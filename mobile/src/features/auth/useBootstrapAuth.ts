/**
 * The startup effect that connects Clerk to the rest of the app.
 *
 * @packageDocumentation
 */

import { useAuth } from "@clerk/clerk-expo";
import { useAuthStore } from "./store";
import { useEffect } from "react";
import { syncUser } from "./api";
import { setApiTokenGetter } from "@/lib/api";

/**
 * Wires Clerk's token into the api client, then loads the customer's account.
 *
 * @remarks
 * Call it exactly once, from the app root. Two effects, in this order and for
 * a reason:
 *
 * First it installs Clerk's `getToken` as the api client's token getter. That
 * happens regardless of whether anybody is signed in, and before any screen
 * has had a chance to fetch — until it runs, every request goes out
 * unauthenticated.
 *
 * Then, once Clerk has loaded, it either fetches the account through
 * `/auth/sync` or clears the store. Before `isLoaded` it does nothing at all:
 * nothing is cleared and nothing is fetched, because Clerk reports a session
 * it has not finished restoring as signed out, and acting on that would sign
 * the customer out on every cold start.
 *
 * A failed sync is recorded as an error and still marks the app
 * bootstrapped, so a server that is down leaves the app usable rather than
 * stuck on a spinner.
 *
 * Renders nothing and returns nothing; it is mounted through a component
 * that returns `null`.
 *
 * @see {@link setApiTokenGetter}
 * @see {@link useAuthStore}
 */
export function useBootstrapAuth() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { setLoading, setUser, clearAuth, setError } = useAuthStore();

  useEffect(() => {
    setApiTokenGetter(async () => {
      const token = await getToken();
      return token ?? null;
    });
  }, [getToken]);

  useEffect(() => {
    async function run() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        clearAuth();
        return;
      }

      try {
        setLoading();

        // /auth/sync answers with the same user record /auth/me would, so
        // one round trip is enough on launch.
        const synced = await syncUser();

        setUser(synced?.user ?? null);
      } catch (error) {
        const errMessage =
          error instanceof Error ? error.message : "Failed to load user";
        setError(errMessage);
      }
    }

    void run();
  }, [isLoaded, isSignedIn, clearAuth, setError, setLoading, setUser]);
}
