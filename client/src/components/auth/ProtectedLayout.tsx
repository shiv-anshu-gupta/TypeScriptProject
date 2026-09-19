/**
 * Route guard: requires a signed-in Clerk session.
 *
 * @remarks
 * The outer of the two guards around `/admin/*`. It answers only "is there a
 * session?". Whether that session is allowed in is
 * {@link RoleGuardLayout}'s job.
 *
 * @packageDocumentation
 */
import { useAuthStore } from "@/features/auth/store";
import { useAuth } from "@clerk/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Commonloader } from "../common/Loader";

/**
 * Renders child routes only once Clerk reports a signed-in user.
 *
 * @remarks
 * There are two separate "still loading" conditions and both must be waited
 * for, otherwise the page flickers through a redirect:
 *
 * - Clerk has not resolved the session yet (`!isLoaded`).
 * - Clerk says signed in, but `useBootstrapAuth` has not yet finished
 *   `POST /auth/sync` and `GET /auth/me`, so the store has no role to judge.
 *
 * On no session it redirects to `/sign-in` and puts the attempted path and
 * query string in router state under `from`. Nothing currently reads that
 * value back — Clerk handles the post-sign-in landing — but it is preserved so
 * a deep link can be restored later.
 *
 * @returns A loader, a redirect to `/sign-in`, or the matched child route.
 */
export function ProtectedLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isBootstrapped, status } = useAuthStore();
  const location = useLocation();

  if (!isLoaded || (isSignedIn && (!isBootstrapped || status === "loading")))
    return <Commonloader />;

  if (!isSignedIn) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
