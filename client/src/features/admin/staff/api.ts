/**
 * Server calls for the staff roster, the shop's networks and the audit trail.
 *
 * @remarks
 * Wrappers over `client/src/lib/api.ts`, which attaches the Clerk bearer token,
 * unwraps the `{ status, data, errors }` envelope and throws `errors[0].message`.
 *
 * Every route behind these calls is admin-only on the server. Nothing here is
 * a permission check - a staff member who runs this module's code from their
 * own devtools gets 403 from the API, which is where the decision lives.
 *
 * @packageDocumentation
 */

import { apiDelete, apiGet, apiPost } from "@/lib/api";

/** One person on the shop's roster, as `GET /admin/staff` returns them. */
export type StaffMember = {
  email: string;
  /** The shopkeeper's own label for them, or their account name. */
  name: string;
  /** Which admin granted the access. */
  addedByEmail: string;
  createdAt: string;
  /** Whether they have ever signed in. */
  signedIn: boolean;
  /** The role their account holds now, or `null` if they have no account yet. */
  role: string | null;
};

/** One registered connection, as `GET /admin/shop-network` returns it. */
export type ShopNetwork = {
  _id: string;
  ip: string;
  label: string;
  registeredByEmail: string;
  /** Last request accepted from this connection, or `null` if never used. */
  lastSeenAt: string | null;
  createdAt: string;
};

/** One recorded act, as `GET /admin/audit` returns it. */
export type AuditRow = {
  _id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  listId: string | null;
  ip: string;
  detail: string;
  createdAt: string;
};

/**
 * The shop's staff roster, newest grant first.
 *
 * @remarks `GET /admin/staff`.
 * @returns `{ items }`.
 */
export async function getStaff() {
  return apiGet<{ items: StaffMember[] }>("/admin/staff");
}

/**
 * Grants staff access to an email address.
 *
 * @remarks
 * `POST /admin/staff`. Adding an address already on the roster updates the
 * label rather than failing.
 *
 * @param email - The address to grant. Lowercased by the server.
 * @param name - The shopkeeper's label for the person.
 * @returns `{ email, appliedNow }` - `appliedNow` is `false` when the person
 * has no account yet, in which case the role waits for their first sign-in.
 * @throws Error when the address is malformed, or belongs to a shop owner.
 */
export async function addStaff(email: string, name: string) {
  return apiPost<{ email: string; appliedNow: boolean }>("/admin/staff", {
    email,
    name,
  });
}

/**
 * Takes staff access away.
 *
 * @remarks
 * `DELETE /admin/staff/:email`. Takes effect on that person's next request -
 * the server re-reads the role from the database every time - so there is no
 * session to wait out.
 *
 * @param email - The address to revoke.
 * @returns `{ email, demoted }`.
 */
export async function removeStaff(email: string) {
  return apiDelete<{ email: string; demoted: boolean }>(
    `/admin/staff/${encodeURIComponent(email)}`,
  );
}

/**
 * Every connection the shop trusts, plus the address of this request.
 *
 * @remarks `GET /admin/shop-network`.
 * @returns `{ items, currentIp }`.
 */
export async function getShopNetworks() {
  return apiGet<{ items: ShopNetwork[]; currentIp: string }>("/admin/shop-network");
}

/**
 * What the server sees this browser's address as, and whether it is trusted.
 *
 * @remarks
 * `GET /admin/shop-network/whoami`. Worth opening once from the shop's Wi-Fi
 * and once from mobile data: if the two report the same address, the gate is
 * not separating them and cannot protect anything.
 *
 * @returns `{ ip, registered }`.
 */
export async function whoami() {
  return apiGet<{ ip: string; registered: boolean }>(
    "/admin/shop-network/whoami",
  );
}

/**
 * Registers the connection this browser is on.
 *
 * @remarks
 * `POST /admin/shop-network`. The address is read from the request, never sent
 * in the body, so this only works while actually on the connection being
 * registered.
 *
 * @param label - A name for it, such as "dukaan ka wifi".
 * @returns `{ ip, label, added }`.
 * @throws Error when three are already registered, or the address is unreadable.
 */
export async function registerThisNetwork(label: string) {
  return apiPost<{ ip: string; label: string; added: boolean }>(
    "/admin/shop-network",
    { label },
  );
}

/**
 * Stops trusting one connection.
 *
 * @remarks
 * `DELETE /admin/shop-network/:id`. Removing the last one locks every staff
 * member out, which is the fastest way to suspend all staff access at once.
 *
 * @param id - The row's id.
 * @returns `{ removed, remaining }`.
 */
export async function removeShopNetwork(id: string) {
  return apiDelete<{ removed: string; remaining: number }>(
    `/admin/shop-network/${encodeURIComponent(id)}`,
  );
}

/**
 * The audit trail, newest first.
 *
 * @remarks
 * `GET /admin/audit`. Bounded, unlike most list routes here: the log grows
 * with every action rather than with every order.
 *
 * @param limit - Rows to fetch, capped at 200 by the server.
 * @returns `{ items, nextBefore }`.
 */
export async function getAudit(limit = 100) {
  return apiGet<{ items: AuditRow[]; nextBefore: string | null }>(
    `/admin/audit?limit=${limit}`,
  );
}
