import { useCallback } from "react";
import { useClerk } from "@clerk/clerk-expo";

type Activate = (params: { session: string }) => Promise<void>;

// Clerk reports failures as { errors: [{ code, message }] }.
export function clerkErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: { code?: string }[] }).errors;
    return errors?.[0]?.code;
  }
  return undefined;
}

// Guards the end of every login against a "pending" session.
//
// Clerk can create a session but hold it back until the user finishes a task
// in Clerk's own screens (choose an organization, reset a password, set up
// MFA) - e.g. when "organization membership required" is switched on in the
// dashboard. The app has no such screens, and Clerk reports a pending session
// as signed out, so the customer would stay on the login while the device
// still holds the session - and every retry fails with "session_exists".
// A pending session is therefore cleared and reported, never left behind.
export function useSessionGuard() {
  const clerk = useClerk();

  // Clear a pending session if the device holds one. True if it did.
  const clearPending = useCallback(async () => {
    const session = clerk.session;
    if (session?.status !== "pending") return false;
    console.warn(
      `[auth] cleared a pending Clerk session (task: ${session.currentTask?.key ?? "unknown"})`,
    );
    await clerk.signOut();
    return true;
  }, [clerk]);

  // Finish a login attempt. One decision for both ways in (Google and the
  // email code), so they can never answer the same situation differently:
  //   "done"       - signed in
  //   "onHold"     - Clerk held the session back; it has been cleared
  //   "incomplete" - Clerk wants something this app doesn't collect
  const complete = useCallback(
    async (
      sessionId: string | null | undefined,
      setActive: Activate | undefined,
    ): Promise<"done" | "onHold" | "incomplete"> => {
      if (!sessionId || !setActive) return "incomplete";
      await setActive({ session: sessionId });
      return (await clearPending()) ? "onHold" : "done";
    },
    [clearPending],
  );

  // A login attempt failed with "session_exists": the device already holds a
  // session. An active one means the customer is in; a pending one is cleared
  // so trying again works.
  const recoverExisting = useCallback(async (): Promise<
    "signedIn" | "cleared"
  > => {
    if (clerk.session?.status === "active") return "signedIn";
    if (await clearPending()) return "cleared";
    // Clerk said a session exists but none is current here - sign the device
    // out completely so the next attempt starts clean.
    if (clerk.client?.sessions?.length) await clerk.signOut();
    return "cleared";
  }, [clerk, clearPending]);

  // The message key for an outcome that isn't "done", so both screens say the
  // same thing.
  const messageForOutcome = (outcome: "onHold" | "incomplete") =>
    outcome === "onHold" ? "auth.accountOnHold" : "auth.setupIncomplete";

  return { clearPending, complete, messageForOutcome, recoverExisting };
}
