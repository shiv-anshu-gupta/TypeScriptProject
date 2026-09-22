/**
 * Who is allowed to do what.
 *
 * This file is the single place that answers that question. Routes ask for a
 * {@link Permission}, never for a role, so widening or narrowing what the shop's
 * staff can do is an edit to one table here rather than a hunt through the
 * routers.
 *
 * The three roles are deliberately unequal in kind, not just in size:
 *
 * - `user` is a customer. It holds no admin permission at all; the panel exists
 *   for the shop, and customers use the mobile app.
 * - `staff` can quote a list and talk to the customer. Nothing else. It cannot
 *   see money totals across the shop, cannot mark an order paid, cannot delete,
 *   and cannot reach the catalogue, promos or settings.
 * - `admin` is the shopkeeper, and holds everything.
 *
 * Two rules are enforced elsewhere but belong in the reader's head here:
 * a staff request must also come from the shop's own network
 * ({@link requiresShopNetwork}), and a staff response must not carry the
 * customer's phone or email (`utils/listForRole.ts`). Neither is a UI
 * decision - the server refuses, and the server omits.
 *
 * @packageDocumentation
 */

/**
 * A role on a {@link ../models/User.User} document.
 *
 * `admin` is granted only from the `ADMIN_EMAILS` environment variable.
 * `staff` is granted by an admin from the panel, and revoked the same way -
 * revocation takes effect on the person's next request, because every request
 * re-reads the role from the database.
 */
export type UserRole = "user" | "staff" | "admin";

/**
 * One thing a caller may be allowed to do.
 *
 * Named `subject:verb` so a route reads as a sentence: `requirePermission(
 * "lists:price")`. Adding one here without adding it to {@link ROLE_PERMISSIONS}
 * grants it to nobody, which is the safe direction to fail.
 */
export type Permission =
  // A grocery list: the shop's daily work.
  | "lists:read"
  | "lists:price"
  | "lists:availability"
  | "lists:chat"
  | "lists:status"
  | "lists:editItem"
  | "lists:addItem"
  | "lists:markPaid"
  // The shop's own numbers and configuration.
  | "dashboard:read"
  | "products:manage"
  | "promos:manage"
  | "settings:manage"
  | "orders:manage"
  | "push:manage"
  // Running the shop's people and its security.
  | "staff:manage"
  | "network:manage"
  | "audit:read";

/**
 * Every permission that exists, in declaration order.
 *
 * Exported so a test can walk the whole matrix rather than the handful of
 * entries someone remembered to check.
 */
export const ALL_PERMISSIONS: readonly Permission[] = [
  "lists:read",
  "lists:price",
  "lists:availability",
  "lists:chat",
  "lists:status",
  "lists:editItem",
  "lists:addItem",
  "lists:markPaid",
  "dashboard:read",
  "products:manage",
  "promos:manage",
  "settings:manage",
  "orders:manage",
  "push:manage",
  "staff:manage",
  "network:manage",
  "audit:read",
];

/**
 * What the shop's staff may do: quote a list, and talk to the customer.
 *
 * The four are exactly the pricing round trip - open the list, put a price on
 * each line, mark what is out of stock, send it, and answer the customer's
 * question about a substitution. `lists:status` is absent on purpose: the
 * pricing route flips the list to `priced` itself, so quoting needs no status
 * write, and packing, holding and completing stay with the shopkeeper.
 */
const STAFF_PERMISSIONS: readonly Permission[] = [
  "lists:read",
  "lists:price",
  "lists:availability",
  "lists:chat",
];

/**
 * The permission table. Read it as the answer to "what can this role do".
 *
 * `admin` is spelled as every permission rather than a wildcard, so that adding
 * a {@link Permission} forces a decision here instead of silently granting it.
 */
export const ROLE_PERMISSIONS: Readonly<
  Record<UserRole, ReadonlySet<Permission>>
> = {
  user: new Set<Permission>(),
  staff: new Set<Permission>(STAFF_PERMISSIONS),
  admin: new Set<Permission>(ALL_PERMISSIONS),
};

/**
 * Whether a role holds a permission.
 *
 * @param role - The role from the caller's `User` document.
 * @param permission - What the route needs.
 * @returns `true` only if the table grants it. An unknown role - a document
 * written by an older build, or a hand-edited one - grants nothing.
 */
export function can(role: UserRole | string, permission: Permission): boolean {
  const granted = ROLE_PERMISSIONS[role as UserRole];
  return granted ? granted.has(permission) : false;
}

/**
 * Whether this role's requests must come from the shop's own network.
 *
 * Only `staff`. The shopkeeper prices lists from home and from the counter
 * alike; the point of the gate is that an employee's access follows them out
 * of the door, not that everyone is chained to the shop's Wi-Fi.
 *
 * @param role - The role from the caller's `User` document.
 * @returns `true` for `staff`, `false` for everyone else.
 */
export function requiresShopNetwork(role: UserRole | string): boolean {
  return role === "staff";
}

/**
 * Whether this role may see the customer's phone number and email address.
 *
 * Only `admin`. Staff quote items and chat in the app; a phone list is the one
 * thing in this system worth stealing, so the server never sends it to them.
 *
 * @param role - The role from the caller's `User` document.
 * @returns `true` for `admin`, `false` for everyone else.
 */
export function canSeeCustomerContact(role: UserRole | string): boolean {
  return role === "admin";
}
