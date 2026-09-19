/**
 * The `/sign-up/*` page.
 *
 * @packageDocumentation
 */
import { SignUp } from "@clerk/react";
import { AuthShell } from "@/components/auth/AuthShell";

/**
 * Clerk's sign-up form inside the sKirana brand frame.
 *
 * @remarks
 * Signing up here creates an ordinary account, not an admin one. The server
 * grants the admin role only to addresses listed in its `ADMIN_EMAILS`
 * environment variable, so a new account made through this page will reach the
 * "Admin access only" screen unless its address is already on that list.
 *
 * Note also that the server's sync promotes but never demotes: removing an
 * address from `ADMIN_EMAILS` does not take admin away from an existing record.
 *
 * Customers should not be arriving here at all — they use the mobile app — which
 * is what the `AuthShell` footnote says.
 */
export function SignUpPage() {
  return (
    <AuthShell>
      <SignUp />
    </AuthShell>
  );
}
