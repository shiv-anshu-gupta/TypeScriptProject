# Clerk session `clerk-session`

The end of every login, in one place: what to do about a Clerk session that exists but is not usable.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/clerk-session.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 2 |

## Description

Used identically by the email-code path and the Google path, so the two can
never answer the same situation differently.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`clerkErrorCode`](#function-clerk-error-code) | Function | `function clerkErrorCode(error: unknown): string \| undefined` | Digs Clerk's machine-readable failure code out of a thrown value. |
| [`useSessionGuard`](#hook-use-session-guard) | Hook | `function useSessionGuard(): { … }` | Guards the end of every login against a "pending" session. |

## Exports in detail

### `clerkErrorCode` {#function-clerk-error-code}

*Function*

Digs Clerk's machine-readable failure code out of a thrown value.

```ts
function clerkErrorCode(error: unknown): string | undefined
```

| Parameter | Type | Meaning |
|---|---|---|
| `error` | `unknown` | — |

**Returns** `string \| undefined` &mdash; The code, or `undefined` for anything that is not a Clerk error — a network failure, for instance. Never throws.

Clerk reports failures as `{ errors: [{ code, message }] }`. Only the first
error is read, which is the one Clerk puts the actionable code on. The
codes the login branches on are `form_identifier_not_found` (no such
account, so sign up instead) and `session_exists` (hand to
`recoverExisting`).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/clerk-session.ts#L29)

### `useSessionGuard` {#hook-use-session-guard}

*Hook*

Guards the end of every login against a "pending" session.

```ts
function useSessionGuard(): {
  clearPending: () => Promise<boolean>;
  complete: (sessionId: string | null | undefined, setActive: Activate | undefined) => Promise<"done" | "onHold" | "incomplete">;
  messageForOutcome: (outcome: "onHold" | "incomplete") => "auth.accountOnHold" | "auth.setupIncomplete";
  recoverExisting: () => Promise<"signedIn" | "cleared">;
}
```

**Returns** `{ clearPending: () => Promise<…>; complete: (sessionId: string \| null \| undefined, setActive: Activate \| und …` &mdash; `clearPending`, `complete`, `recoverExisting` and `messageForOutcome`; see the comment on each below.

Clerk can create a session but hold it back until the user finishes a task
in Clerk's own screens (choose an organization, reset a password, set up
MFA) - e.g. when "organization membership required" is switched on in the
dashboard. The app has no such screens, and Clerk reports a pending session
as signed out, so the customer would stay on the login while the device
still holds the session - and every retry fails with "session_exists".
A pending session is therefore cleared and reported, never left behind.

The login panel also calls `clearPending` as soon as it appears, so a
session left pending by an earlier attempt cannot block the new one.

Every returned function can throw whatever Clerk throws — `signOut` and
`setActive` are network calls — so callers wrap them.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/clerk-session.ts#L58)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/clerk-session.ts)
