/**
 * The customer's own details, as the shop sees them.
 *
 * @remarks
 * Both endpoints need a bearer token and act on the signed-in customer; there
 * is no id in either URL.
 *
 * @packageDocumentation
 */

import { apiGet, apiPatch } from "@/lib/api";

/**
 * The customer's own details as the SHOP sees them on their orders.
 *
 * @remarks
 * Separate from the Clerk account, and the one that matters: this name and
 * mobile are what the shopkeeper reads on an order and rings if something is
 * unclear.
 *
 * Every field is a string, never null — an unset phone is `""`. `email` is
 * read-only here; it comes from the sign-in and cannot be patched.
 */
export type CustomerProfile = {
  name: string;
  email: string;
  phone: string;
};

/**
 * A partial profile edit.
 *
 * @remarks
 * Both fields are optional, so the profile sheet can send only what changed.
 * A phone is allowed to be empty, but a non-empty one must be a valid Indian
 * mobile — the app checks with `isValidMobile` before sending, and the server
 * checks again.
 */
export type UpdateCustomerProfileBody = {
  name?: string;
  phone?: string;
};

/**
 * `GET /customer/profile` — the signed-in customer's saved details.
 *
 * @returns The profile, with `""` for anything not yet filled in.
 * @throws Error When signed out, or the request fails.
 */
export async function getCustomerProfile() {
  return apiGet<CustomerProfile>("/customer/profile");
}

/**
 * `PATCH /customer/profile` — saves an edit.
 *
 * @returns The whole profile as saved, not just the changed fields, so the
 * caller can put the answer straight into the store.
 * @throws Error When signed out, or the server rejects the number.
 */
export async function updateCustomerProfile(body: UpdateCustomerProfileBody) {
  return apiPatch<CustomerProfile, UpdateCustomerProfileBody>(
    "/customer/profile",
    body,
  );
}
