/**
 * Route guard: requires the signed-in user to hold an allowed role.
 *
 * @remarks
 * The inner of the two guards around `/admin/*`, and the one that produces the
 * app's two full-screen error states.
 *
 * @packageDocumentation
 */
import { useAuthStore } from "@/features/auth/store";
import type { UserRole } from "@/lib/types";
import { Navigate, Outlet } from "react-router-dom";
import { SignOutButton } from "@clerk/react";
import { Commonloader } from "../common/Loader";
import { Button } from "@/components/ui/button";

/**
 * Props for {@link RoleGuardLayout}.
 */
type RoleGuardLayoutProps = {
  /** Roles permitted through. The router passes `["admin"]` and nothing else. */
  allow: UserRole[];
};

/**
 * Renders child routes only for a user whose role is in `allow`.
 *
 * @remarks
 * The role is read from the auth store, never from Clerk metadata. The store is
 * filled by `useBootstrapAuth` from `GET /auth/me`, and the server decides the
 * role by matching the account's email against its `ADMIN_EMAILS` list. So a
 * user cannot grant themselves admin from the browser, and equally the client
 * cannot know the role until the API has answered.
 *
 * Four outcomes:
 *
 * - Store not bootstrapped, or loading — a loader.
 * - `status === "error"` — the "Couldn't reach the shop server" screen, with
 *   Try again and Sign out. In practice this is most often a CORS problem: the
 *   axios wrapper reports a blocked origin as the opaque string
 *   `"Network Error"`, which is shown underneath when present. It is *not*
 *   normally a sign that the user is signed out.
 * - No user — redirect to `/sign-in`.
 * - Role not allowed — the "Admin access only" screen, with Sign out.
 *
 * Both error screens deliberately avoid redirecting, and must not be
 * "simplified" into redirects. The inline comments record why: `/sign-in`
 * sees a live Clerk session and sends the user straight back, and `/` is
 * `<Navigate to="/admin">`, which re-enters this guard. Either change produces
 * an infinite loop.
 *
 * This is user experience only. The real enforcement is the server's
 * `requireAdmin` middleware, which answers `403 "Admin access only"` on every
 * `/admin/*` request regardless of what the browser does.
 *
 * @returns A loader, an error screen, a redirect, or the matched child route.
 */
export function RoleGuardLayout({ allow }: RoleGuardLayoutProps) {
  const { isBootstrapped, status, user, error } = useAuthStore();

  if (!isBootstrapped || status === "loading") {
    return <Commonloader />;
  }

  // Signed in with Clerk, but our server couldn't load the account (it's down,
  // or it blocked this site's address). Sending them to /sign-in here would
  // loop: that page sees a signed-in user and sends them straight back.
  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary/45 px-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Couldn't reach the shop server
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          You're signed in, but your account couldn't be loaded. Check your
          internet and try again.
        </p>
        {error ? (
          <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
        ) : null}
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <SignOutButton>
            <Button variant="outline">Sign out</Button>
          </SignOutButton>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // Signed in, but not an admin. We must NOT redirect to "/" here — root now
  // points at /admin, which would bounce right back into this guard (infinite
  // loop). Instead show a clear message with a way out.
  if (!allow.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-secondary/45 px-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Admin access only
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This is the sKirana shop panel, for store owners. Your account
          doesn't have admin access. If you're a customer, please use the
          sKirana mobile app.
        </p>
        <SignOutButton>
          <Button>Sign out</Button>
        </SignOutButton>
      </div>
    );
  }

  return <Outlet />;
}
