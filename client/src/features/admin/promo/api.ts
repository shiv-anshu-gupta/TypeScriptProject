/**
 * Server calls for admin promo codes.
 *
 * @remarks
 * Thin wrappers over the helpers in `client/src/lib/api.ts`, which attach the
 * Clerk bearer token, unwrap the `{ status, data, errors }` envelope and throw
 * `errors[0].message` on failure. Callers therefore receive the payload
 * directly and must catch to handle an error.
 *
 * Every route here answers with the full refreshed promo list, not just the
 * changed record, so {@link useAdminPromos} replaces its state wholesale after
 * each mutation. Requests carry JSON, not form-data.
 *
 * @packageDocumentation
 */

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { AdminPromosResponse, PromoFormValues } from "./types";

/**
 * Fetches every promo code.
 *
 * @remarks
 * `GET /admin/promos`. Called once on mount by {@link useAdminPromos}; there is
 * no polling.
 *
 * @returns The response envelope's payload, `{ items: Promo[] }`.
 * @throws Error carrying the server's first error message, or the axios message
 * (for example the opaque `"Network Error"` that a blocked CORS origin
 * produces).
 */
export async function getAdminPromos() {
  return apiGet<AdminPromosResponse>("/admin/promos");
}

/**
 * Creates a promo code.
 *
 * @remarks
 * `POST /admin/promos`. The body is `PromoFormValues`, so numbers arrive as
 * strings and dates as ISO strings; parsing and validation are the server's
 * job.
 *
 * @param body - Values collected by `PromoDialog`.
 * @returns The full refreshed list, which replaces client state.
 * @throws Error carrying the server's message, for example on a duplicate code.
 */
export async function createAdminPromo(body: PromoFormValues) {
  return apiPost<AdminPromosResponse, PromoFormValues>("/admin/promos", body);
}

/**
 * Updates one promo code.
 *
 * @remarks
 * `PATCH /admin/promos/:id`. Despite being a PATCH, the dialog always sends all
 * six fields.
 *
 * @param promoId - The promo's `_id`.
 * @returns The full refreshed list.
 * @throws Error carrying the server's message.
 */
export async function updateAdminPromo(promoId: string, body: PromoFormValues) {
  return apiPatch<AdminPromosResponse, PromoFormValues>(
    `/admin/promos/${promoId}`,
    body,
  );
}

/**
 * Deletes one promo code.
 *
 * @remarks
 * `DELETE /admin/promos/:id`. The `window.confirm` prompt is in
 * {@link useAdminPromos}, not here — this call deletes unconditionally.
 *
 * @param promoId - The promo's `_id`.
 * @returns The full refreshed list.
 * @throws Error carrying the server's message.
 */
export async function deleteAdminPromo(promoId: string) {
  return apiDelete<AdminPromosResponse>(`/admin/promos/${promoId}`);
}
