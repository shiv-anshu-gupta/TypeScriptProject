import { useAuthStore } from "@/features/auth/store";
import type { UserRole } from "@/lib/types";
import { Navigate, Outlet } from "react-router-dom";
import { SignOutButton } from "@clerk/react";
import { Commonloader } from "../common/Loader";
import { Button } from "@/components/ui/button";

type RoleGuardLayoutProps = {
  allow: UserRole[];
};

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
