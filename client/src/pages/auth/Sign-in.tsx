/**
 * The `/sign-in/*` page.
 *
 * @packageDocumentation
 */
import { SignIn } from "@clerk/react";
import { AuthShell } from "@/components/auth/AuthShell";

/**
 * Clerk's sign-in form inside the sKirana brand frame.
 *
 * @remarks
 * All of the behaviour — credentials, OAuth, multi-factor, error messages — is
 * Clerk's. Nothing here is custom, and the form's look is configured centrally
 * in `lib/clerk-appearance.ts` rather than by props.
 *
 * The route is `/sign-in/*` with a trailing wildcard because Clerk renders its
 * own sub-routes (factor selection, verification) beneath this path.
 *
 * Sign-in does not by itself grant access to the panel. The account must also
 * carry the admin role, which the server assigns from `ADMIN_EMAILS`; a
 * non-admin who signs in successfully lands on `RoleGuardLayout`'s
 * "Admin access only" screen.
 */
export function SignInPage() {
  return (
    <AuthShell>
      <SignIn />
    </AuthShell>
  );
}
