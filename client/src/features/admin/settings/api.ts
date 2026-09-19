/**
 * Server calls for the app's home banners.
 *
 * @remarks
 * Wrappers over `client/src/lib/api.ts`, which attaches the Clerk bearer token,
 * unwraps the `{ status, data, errors }` envelope and throws
 * `errors[0].message`. Callers get the payload directly.
 *
 * Every route answers with the same `AdminBannersResponse` — the full list in
 * its current order, plus the carousel limit — so {@link useAdminBanners} can
 * apply any response the same way.
 *
 * @packageDocumentation
 */

import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type { AdminBannersResponse, UpdateBannerBody } from "./types";

/** Shared path prefix for every banner route. */
const BASE = "/admin/settings/banners";

/**
 * Fetches every banner, in order, plus the carousel limit.
 *
 * @remarks
 * `GET /admin/settings/banners`. Runs once on mount and again on "Refresh";
 * there is no polling.
 *
 * @returns `{ items, limit }`.
 * @throws Error carrying the server's first error message, or the axios
 * message.
 */
export async function getAdminBanners() {
  return apiGet<AdminBannersResponse>(BASE);
}

/**
 * Uploads one or more banner images.
 *
 * @remarks
 * `POST /admin/settings/banners`, as multipart form-data under the repeated
 * field name `images`. The files are sent exactly as picked — banners skip the
 * browser-side compression in `client/src/lib/image.ts` that product images go
 * through. The server applies its own 5 MB, 10-file and MIME limits, and
 * appends the new banners to the end of the order.
 *
 * @param files - Files already validated by `BannerUploader`; only ones without
 * a blocking error reach here.
 * @returns The full refreshed list.
 * @throws Error carrying the server's message, for example a rejected file size
 * or type.
 */
export async function uploadAdminBanners(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  return apiPost<AdminBannersResponse, FormData>(BASE, formData);
}

/**
 * Updates one banner's title, link, schedule or visibility.
 *
 * @remarks
 * `PATCH /admin/settings/banners/:id`. The body is partial, so the visibility
 * toggle sends `isActive` alone while the edit dialog sends title, link and
 * both dates. Sending `null` for `startsAt` or `endsAt` clears that date.
 *
 * @param bannerId - The banner's `_id`.
 * @returns The full refreshed list.
 * @throws Error carrying the server's message.
 */
export async function updateAdminBanner(bannerId: string, body: UpdateBannerBody) {
  return apiPatch<AdminBannersResponse, UpdateBannerBody>(`${BASE}/${bannerId}`, body);
}

/**
 * Stores a new banner order.
 *
 * @remarks
 * `PUT /admin/settings/banners/order` with the complete list of ids in the
 * wanted order — not a move instruction. This is the one call the UI fires
 * optimistically: {@link useAdminBanners} swaps the two rows locally first and
 * restores the previous order if this rejects.
 *
 * @param ids - Every banner's `_id`, in the new order.
 * @returns The full refreshed list, in the stored order.
 * @throws Error carrying the server's message.
 */
export async function reorderAdminBanners(ids: string[]) {
  return apiPut<AdminBannersResponse, { ids: string[] }>(`${BASE}/order`, { ids });
}

/**
 * Deletes one banner and its stored image.
 *
 * @remarks
 * `DELETE /admin/settings/banners/:id`. Not reversible — the picture goes too,
 * which is why `BannerList` confirms in a dialog and suggests hiding instead.
 *
 * @param bannerId - The banner's `_id`.
 * @returns The full refreshed list.
 * @throws Error carrying the server's message.
 */
export async function deleteAdminBanner(bannerId: string) {
  return apiDelete<AdminBannersResponse>(`${BASE}/${bannerId}`);
}
