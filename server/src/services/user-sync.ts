/**
 * Keeps the app's own user record in step with Clerk.
 *
 * @remarks
 * A person is identified by their Clerk user id, but that id is per Clerk
 * INSTANCE: when the app moved from Clerk's test instance to production,
 * every returning customer got a new id with the same email. The users
 * collection has a unique index on email, so creating a second record failed
 * and the customer ended up with no record at all ("User is not found in the
 * DB"). A verified email that already has a record is therefore re-linked to
 * the new id - keeping the customer's lists, phone number and role.
 *
 * @packageDocumentation
 */
import { clerkClient } from "@clerk/express";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";

/** The parts of a Clerk account this app keeps a copy of. */
type ClerkIdentity = {
  email: string | null;
  emailVerified: boolean;
  name: string | undefined;
};

/** MongoDB's error code for a unique-index violation. */
const DUPLICATE_KEY = 11000;

/**
 * Whether an error is MongoDB refusing a write that would duplicate a unique
 * key - here, always the unique index on `email`.
 */
function isDuplicateKey(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    (error as { code?: number }).code === DUPLICATE_KEY
  );
}

/**
 * The set of emails that are allowed to be admins, from `ADMIN_EMAILS`
 * (comma-separated, lowercased).
 *
 * @remarks
 * Read fresh on every call rather than cached, so the list can be changed by
 * editing the environment and restarting, with no deploy.
 *
 * This only ever GRANTS the role - an email removed from the list does not
 * demote an existing admin record. Doing that takes a database edit.
 */
function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Fetches the account from Clerk's API and reduces it to what this app keeps.
 *
 * @remarks
 * A network call to Clerk. The primary email is preferred, falling back to
 * the first one on the account; it is lowercased and trimmed so that it
 * matches what is stored. The name is first plus last, falling back to the
 * username, and `undefined` when the account carries neither.
 *
 * @throws Whatever the Clerk SDK throws - notably when the id is unknown to
 * this Clerk instance.
 */
async function readClerkIdentity(clerkUserId: string): Promise<ClerkIdentity> {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primary =
    clerkUser.emailAddresses.find(
      (item) => item.id === clerkUser.primaryEmailAddressId,
    ) ?? clerkUser.emailAddresses[0];

  const fullName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    email: primary?.emailAddress?.trim().toLowerCase() || null,
    emailVerified: primary?.verification?.status === "verified",
    name: fullName || clerkUser.username || undefined,
  };
}

// Emails are matched case-insensitively (Clerk lowercases them, but records
// from older code may not be).
const CASE_INSENSITIVE = { locale: "en", strength: 2 } as const;

/**
 * Returns the user record for a Clerk user, creating it - or re-linking an
 * earlier record with the same verified email - when there isn't one yet.
 * Safe to call repeatedly and concurrently.
 *
 * @remarks
 * Calls Clerk's API every time, then takes one of three paths, numbered in
 * the body:
 *
 * 1. the id is already known - refresh the email, fill in a missing name, and
 *    grant admin if the email is in `ADMIN_EMAILS`;
 * 2. no record for this id, but one exists with the same VERIFIED email - it
 *    is the same person after a Clerk instance change, so the record is moved
 *    onto the new id, keeping their lists, phone number and role. Only a
 *    verified email may claim a record;
 * 3. otherwise create a new one.
 *
 * WRITES in every path except an unchanged case 1. A re-link is logged with
 * both ids.
 *
 * Concurrency-safe by retry, not by locking: two requests from the same login
 * can both reach case 3, and the loser catches the duplicate-key error and
 * returns the record the winner created.
 *
 * @returns The Mongoose user document.
 * @throws {@link AppError} 409 when the email already belongs to another
 * record that could not be re-linked because it is not verified on this
 * account. Clerk API and other database errors propagate unchanged.
 */
export async function syncDbUser(clerkUserId: string) {
  const identity = await readClerkIdentity(clerkUserId);
  const shouldBeAdmin = identity.email
    ? adminEmails().has(identity.email)
    : false;

  // 1. Already known under this Clerk id: refresh what Clerk owns. The name is
  //    only filled in when empty - the customer may have changed it in the
  //    app, and that's the name the shop sees on their orders.
  const existing = await User.findOne({ clerkUserId });
  if (existing) {
    let changed = false;
    if (identity.email && identity.email !== existing.email) {
      const taken = await User.exists({
        email: identity.email,
        _id: { $ne: existing._id },
      }).collation(CASE_INSENSITIVE);
      if (!taken) {
        existing.email = identity.email;
        changed = true;
      }
    }
    if (!existing.name && identity.name) {
      existing.name = identity.name;
      changed = true;
    }
    if (shouldBeAdmin && existing.role !== "admin") {
      existing.role = "admin";
      changed = true;
    }
    if (changed) await existing.save();
    return existing;
  }

  // 2. A record with the same VERIFIED email under an older Clerk id: the same
  //    person, back after a Clerk instance change. Only a verified email may
  //    claim a record - otherwise anyone could type someone else's address.
  if (identity.email && identity.emailVerified) {
    const previous = await User.findOne({ email: identity.email }).collation(
      CASE_INSENSITIVE,
    );
    if (previous) {
      const oldId = previous.clerkUserId;
      previous.clerkUserId = clerkUserId;
      if (!previous.name && identity.name) previous.name = identity.name;
      if (shouldBeAdmin) previous.role = "admin";
      await previous.save();
      console.info(
        `[user-sync] re-linked user ${String(previous._id)} from ${oldId} to ${clerkUserId}`,
      );
      return previous;
    }
  }

  // 3. A new customer.
  try {
    return await User.create({
      clerkUserId,
      email: identity.email ?? undefined,
      name: identity.name,
      role: shouldBeAdmin ? "admin" : "user",
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Two requests from the same login raced to create the record and the
    // other one won - use it.
    const created = await User.findOne({ clerkUserId });
    if (created) return created;
    // The email belongs to another record and couldn't be re-linked (it isn't
    // verified on this account).
    throw new AppError(
      409,
      "This email is already used by another sKirana account. Please contact the shop.",
    );
  }
}
