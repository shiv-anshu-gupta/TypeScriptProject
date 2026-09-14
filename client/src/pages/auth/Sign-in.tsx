import { SignIn } from "@clerk/react";
import { AuthShell } from "@/components/auth/AuthShell";

export function SignInPage() {
  return (
    <AuthShell>
      <SignIn />
    </AuthShell>
  );
}
