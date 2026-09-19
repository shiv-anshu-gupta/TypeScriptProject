/**
 * The end of every login, in one place: what to do about a Clerk session that
 * exists but is not usable.
 *
 * @remarks
 * Used identically by the email-code path and the Google path, so the two can
 * never answer the same situation differently.
 *
 * @packageDocumentation
 */
import { useCallback } from "react";
import { useClerk } from "@clerk/clerk-expo";

type Activate = (params: { session: string }) => Promise<void>;

/**
 * Digs Clerk's machine-readable failure code out of a thrown value.
 *
 * @remarks
 * Clerk reports failures as `{ errors: [{ code, message }] }`. Only the first
 * error is read, which is the one Clerk puts the actionable code on. The
 * codes the login branches on are `form_identifier_not_found` (no such
 * account, so sign up instead) and `session_exists` (hand to
 * `recoverExisting`).
 *
 * @returns The code, or `undefined` for anything that is not a Clerk error —
 * a network failure, for instance. Never throws.
 */
export function clerkErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: { code?: string }[] }).errors;
    return errors?.[0]?.code;
  }
  return undefined;
}

/**
 * Guards the end of every login against a "pending" session.
 *
 * @remarks
 * Clerk can create a session but hold it back until the user finishes a task
 * in Clerk's own screens (choose an organization, reset a password, set up
 * MFA) - e.g. when "organization membership required" is switched on in the
 * dashboard. The app has no such screens, and Clerk reports a pending session
 * as signed out, so the customer would stay on the login while the device
 * still holds the session - and every retry fails with "session_exists".
 * A pending session is therefore cleared and reported, never left behind.
 *
 * The login panel also calls `clearPending` as soon as it appears, so a
 * session left pending by an earlier attempt cannot block the new one.
 *
 * Every returned function can throw whatever Clerk throws — `signOut` and
 * `setActive` are network calls — so callers wrap them.
 *
 * @returns `clearPending`, `complete`, `recoverExisting` and
 * `messageForOutcome`; see the comment on each below.
 */
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
