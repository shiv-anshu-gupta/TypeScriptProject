/**
 * Route guard for the sign-in and sign-up pages: keeps signed-in users out.
 *
 * @remarks
 * Wraps `/sign-in/*` and `/sign-up/*` only.
 *
 * @packageDocumentation
 */
import { useAuthStore } from "@/features/auth/store";
import { useAuth } from "@clerk/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Commonloader } from "../common/Loader";

/**
 * Sends an already signed-in user away from the sign-in page.
 *
 * @remarks
 * Two defects are worth knowing about before anyone reads this guard as
 * written. Neither is currently harmful, because `ProtectedLayout` catches the
 * cases that matter, but both mean the guard does less than it appears to:
 *
 * - The `!isLoaded` branch is a bare expression statement. Nothing is
 *   returned, so it has no effect and the function falls through.
 * - The pathname comparison for sign-up is missing its leading slash, so it
 *   never matches. A signed-in user landing on `/sign-up` is not redirected
 *   away.
 *
 * The redirect target is `/`, which the router turns into `/admin`.
 *
 * @returns A loader, a redirect to `/`, or the matched child route.
 */
export function PublicOnlyLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isBootstrapped, status } = useAuthStore();
  const location = useLocation();

  if (!isLoaded) null;

  if (isSignedIn && (!isBootstrapped || status === "loading")) {
    return <Commonloader />;
  }

  if (
    isSignedIn &&
    (location.pathname === "/sign-in" || location.pathname === "sign-up")
  ) {
    return <Navigate to={"/"} replace />;
  }

  return <Outlet />;
}
