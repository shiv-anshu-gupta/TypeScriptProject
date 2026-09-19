/**
 * Turns a Clerk session into an application user, once per page load.
 *
 * @remarks
 * This is the bridge between Clerk (which knows the identity) and the server
 * (which knows the role). Nothing else in the app writes the auth store.
 *
 * @packageDocumentation
 */
import { useAuth } from "@clerk/react";
import { useAuthStore } from "./store";
import { useEffect } from "react";
import { getMe, syncUser } from "./api";
import { setApiTokenGetter } from "@/lib/api";

/**
 * Installs the API token getter and loads the signed-in user into the store.
 *
 * @remarks
 * Called exactly once, from `App`, above the router. Calling it from a route
 * would re-run the bootstrap on every navigation.
 *
 * It runs two effects:
 *
 * 1. Hands Clerk's `getToken` to `lib/api.ts`, so every axios request from
 *    anywhere in the app carries a fresh bearer token. This is why no feature
 *    module ever deals with tokens itself. It re-installs whenever `getToken`
 *    changes identity.
 * 2. On any change to the Clerk session: signed out clears the store; signed in
 *    runs `POST /auth/sync` and then `GET /auth/me` in that order, and stores
 *    the result. Sync must come first so a first-time user has a record to
 *    read.
 *
 * A failure of either call is caught and recorded as `status: "error"` rather
 * than thrown. `RoleGuardLayout` turns that into the "Couldn't reach the shop
 * server" screen. The usual cause is the server's `CORS_ORIGINS` not listing
 * this site, which the browser reports only as `"Network Error"`.
 *
 * There is no retry and no polling. The recovery path is the Try again button,
 * which reloads the page.
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

        await syncUser();
        const me = await getMe();

        setUser(me?.user);
      } catch (error) {
        const errMessage =
          error instanceof Error ? error.message : "Failed to load user";
        setError(errMessage);
      }
    }

    void run();
  }, [isLoaded, isSignedIn, clearAuth, setError, setLoading, setUser]);
}
