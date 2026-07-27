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
  const { isBootstrapped, status, user } = useAuthStore();

  if (!isBootstrapped || status === "loading") {
    return <Commonloader />;
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
