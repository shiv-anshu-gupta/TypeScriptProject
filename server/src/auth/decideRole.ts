/**
 * Decides which role an account should hold, every time it signs in.
 *
 * @remarks
 * Pure on purpose: no database, no Clerk, no environment. Everything it needs
 * is passed in, so the rules below can be asserted in a unit test rather than
 * inferred by reading `services/user-sync.ts`.
 *
 * The rules, in the order they are applied:
 *
 * 1. **An unverified email elevates nobody.** Both the shopkeeper's list and
 *    the staff roster are keyed by email address, so granting a role to an
 *    address the person has not proved they own would let anyone type their
 *    way in. This was a real gap before staff existed: the admin grant did not
 *    check verification at account creation.
 * 2. **`ADMIN_EMAILS` makes an admin**, and nothing else does.
 * 3. **An existing admin is never demoted.** Removing an address from
 *    `ADMIN_EMAILS` does not take the shop away from whoever is holding it;
 *    that has always been the behaviour here and is left alone deliberately,
 *    because the alternative is a typo in an environment variable locking the
 *    shopkeeper out of their own shop.
 * 4. **The staff roster makes a staff member**, and removal from it takes the
 *    role away again on the next sign-in - while the permission gate takes the
 *    access away on the very next request.
 *
 * @packageDocumentation
 */
import type { UserRole } from "./permissions";

/**
 * Everything the decision depends on.
 */
export type RoleInput = {
  /** The account's primary email, lowercased, or `null` if it has none. */
  email: string | null;
  /** Whether Clerk reports that email as verified. */
  emailVerified: boolean;
  /** Whether the address appears in `ADMIN_EMAILS`. */
  isAdminEmail: boolean;
  /** Whether the address appears on the shop's staff roster. */
  isStaffEmail: boolean;
  /** The role already on the record, if there is one. */
  currentRole?: string;
};

/**
 * The role this account should hold now.
 *
 * @param input - The identity, the two grant lists, and the current role.
 * @returns The role to store. Never throws.
 *
 * @example
 * ```ts
 * const role = decideRole({
 *   email: "raju@example.com",
 *   emailVerified: true,
 *   isAdminEmail: false,
 *   isStaffEmail: true,
 *   currentRole: "user",
 * }); // "staff"
 * ```
 */
export function decideRole(input: RoleInput): UserRole {
  const provable = Boolean(input.email) && input.emailVerified;

  if (provable && input.isAdminEmail) return "admin";

  // Rule 3: an admin already on the record keeps it.
  if (input.currentRole === "admin") return "admin";

  if (provable && input.isStaffEmail) return "staff";

  return "user";
}
