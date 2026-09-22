/**
 * Removes the customer's contact details from anything bound for a role that
 * may not see them.
 *
 * This is the wall, and it stands here rather than in the panel's React code,
 * because a browser cannot be trusted to keep a secret it has been handed. A
 * staff member's devtools show exactly what their screen shows, because that
 * is all the server sent.
 *
 * Applied at the edge of every admin list route, so a new route that forgets
 * to call it is the one kind of mistake this file cannot prevent - which is
 * why `routes/admin/grocery-list.routes.ts` funnels every response through a
 * single helper.
 *
 * @packageDocumentation
 */
import { canSeeCustomerContact, type UserRole } from "../auth/permissions";

/**
 * The contact-bearing shape of a mapped grocery list.
 *
 * Only the three fields this module touches are named; everything else on the
 * list passes through untyped and unread, so adding a field to
 * `mapGroceryList` needs no edit here.
 */
type WithCustomerContact = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};

/**
 * Whether a display name is really an email address wearing a name's clothes.
 *
 * `mapGroceryList` falls back to the account's email when a customer never set
 * a name, so `customerName` is a leak channel as real as `customerEmail`. An
 * `@` is the whole test: no human writes one in a shop name.
 *
 * @param name - The `customerName` as mapped.
 * @returns `true` when the value must not be forwarded.
 */
function looksLikeEmail(name: string | undefined): boolean {
  return typeof name === "string" && name.includes("@");
}

/**
 * Strips contact details from one object, whatever else it carries.
 *
 * @typeParam T - The mapped row; its other fields are returned untouched.
 * @param row - One mapped list or conversation row.
 * @param role - The role of the caller the response is bound for.
 * @returns `row` itself for an admin. For everyone else a new object with
 * `customerEmail` and `customerPhone` **absent** - deleted, not set to `""` or
 * `undefined`, so `JSON.stringify` cannot carry them - and `customerName`
 * blanked when it is an email address. Staff identify an order by its code.
 */
function redact<T extends WithCustomerContact>(row: T, role: UserRole | string) {
  if (canSeeCustomerContact(role)) return row;

  const { customerEmail: _email, customerPhone: _phone, ...rest } = row;
  if (looksLikeEmail(rest.customerName)) {
    return { ...rest, customerName: "" };
  }
  return rest;
}

/**
 * One grocery list, cut to what this role may receive.
 *
 * @param list - A list as `mapGroceryList` built it.
 * @param role - The caller's role.
 * @returns The list, redacted for anyone who is not an admin.
 *
 * @example
 * ```ts
 * res.json(ok({ items: lists.map((l) => listForRole(l, role)) }));
 * ```
 */
export function listForRole<T extends WithCustomerContact>(
  list: T,
  role: UserRole | string,
) {
  return redact(list, role);
}

/**
 * One chat conversation row, cut to what this role may receive.
 *
 * The conversations endpoint carries `customerPhone` of its own, so it needs
 * the same treatment as a list and gets it through the same code path.
 *
 * @param row - A row as the conversations route built it.
 * @param role - The caller's role.
 * @returns The row, redacted for anyone who is not an admin.
 */
export function conversationForRole<T extends WithCustomerContact>(
  row: T,
  role: UserRole | string,
) {
  return redact(row, role);
}
