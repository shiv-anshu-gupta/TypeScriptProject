import { SignUp } from "@clerk/react";
import { AuthShell } from "@/components/auth/AuthShell";

export function SignUpPage() {
  return (
    <AuthShell>
      <SignUp />
    </AuthShell>
  );
}
