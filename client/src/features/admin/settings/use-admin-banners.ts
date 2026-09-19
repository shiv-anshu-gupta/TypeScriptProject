/**
 * State and server calls for the `/admin/settings` home-banners page.
 *
 * @remarks
 * One hook owns the list, the carousel limit and every mutation. The page is
 * layout only. All errors are surfaced as toasts here rather than thrown at the
 * page.
 *
 * @packageDocumentation
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { AdminBanner, AdminBannersResponse, UpdateBannerBody } from "./types";
import {
  deleteAdminBanner,
  getAdminBanners,
  reorderAdminBanners,
  updateAdminBanner,
  uploadAdminBanners,
} from "./api";

/**
 * Carousel limit used until the server sends one, and whenever a response omits
 * it.
 *
 * @remarks
 * Matches the server's value at the time of writing. The limit is advisory: the
 * server does not refuse to store more live banners than this, so the extras
 * show as `overLimit` in the list instead of being rejected.
 */
const DEFAULT_LIMIT = 8;

/**
 * Turns an unknown thrown value into toast text.
 *
 * @remarks
 * The API helpers always throw an `Error` carrying the server's first error
 * message, so in practice this returns that message; the fallback covers
 * anything else.
 *
 * @param error - The caught value.
 * @returns A message to show the shopkeeper.
 */
function message(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

// Everything the Home banners page does. Every change goes to the server,
// which answers with the full, freshly ordered list - so the page always
// shows exactly what the app will.
/**
 * Drives the home-banners page.
 *
 * @remarks
 * Fetches `GET /admin/settings/banners` on mount. There is **no polling** — the
 * list changes only through this admin's own actions or the "Refresh" button.
 *
 * Every mutation returns the full list plus the limit, and `apply` replaces both
 * wholesale, so the page always reflects exactly what the server will serve the
 * app. `limit` is therefore re-read on every response.
 *
 * `move` is the **one optimistic mutation** in this app: the swap is applied to
 * local state first, then `PUT …/order` is sent, and the previous array is
 * restored if the request fails. Everything else waits for the server.
 *
 * Every call catches its own error and shows a toast, so nothing here rejects at
 * the page. `upload`, `update` and `remove` return a boolean instead, which the
 * uploader and the delete confirmation use to decide whether to clear
 * themselves.
 *
 * Local-only state: `loading`, `uploading` and `busyId`. Nothing is persisted.
 *
 * @returns The banner list, the carousel limit, the progress flags and the
 * mutations the page needs.
 */
export function useAdminBanners() {
  const [items, setItems] = useState<AdminBanner[]>([]);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  // Banner currently being saved, so only its row shows as busy.
  const [busyId, setBusyId] = useState<string | null>(null);

  /**
   * Replaces list and limit from any banner response.
   *
   * @remarks
   * Called by every mutation, which is why a reorder or a delete also refreshes
   * the limit. Falls back to an empty list and {@link DEFAULT_LIMIT} if the
   * server omits either field.
   */
  const apply = (response: AdminBannersResponse) => {
    setItems(response.items ?? []);
    setLimit(response.limit ?? DEFAULT_LIMIT);
  };

  /**
   * Reloads the list from `GET /admin/settings/banners`.
   *
   * @remarks
   * Runs on mount and behind the page's "Refresh" button. A failure toasts and
   * leaves the previous list in place. Memoised with `useCallback` and no
   * dependencies, so the mount effect runs once.
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      apply(await getAdminBanners());
    } catch (error) {
      toast.error(`Couldn't load banners: ${message(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Uploads picked banner files.
   *
   * @remarks
   * `POST /admin/settings/banners` as multipart form-data. New banners land at
   * the end of the order. Returns early with `false` when given no files, so an
   * empty selection makes no request. Errors toast and return `false`.
   *
   * @param files - Files the uploader judged acceptable.
   * @returns `true` when the upload succeeded, which the uploader uses to clear
   * its picked list and revoke the preview URLs.
   */
  const upload = async (files: File[]) => {
    if (!files.length) return false;
    try {
      setUploading(true);
      apply(await uploadAdminBanners(files));
      toast.success(files.length === 1 ? "Banner added" : `${files.length} banners added`);
      return true;
    } catch (error) {
      toast.error(message(error));
      return false;
    } finally {
      setUploading(false);
    }
  };

  /**
   * Patches one banner.
   *
   * @remarks
   * `PATCH /admin/settings/banners/:id`. Sets `busyId` for the duration, which
   * the list uses to dim that row and disable the controls on every row.
   *
   * @param body - Partial patch; only the fields present are changed.
   * @param done - Success toast. Omit it for a silent save.
   * @returns `true` on success. The edit dialog closes only on `true`, so a
   * failed save keeps the admin's edits on screen.
   */
  const update = async (banner: AdminBanner, body: UpdateBannerBody, done?: string) => {
    try {
      setBusyId(banner._id);
      apply(await updateAdminBanner(banner._id, body));
      if (done) toast.success(done);
      return true;
    } catch (error) {
      toast.error(message(error));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Flips a banner between shown and hidden.
   *
   * @remarks
   * A thin {@link update} that sends `isActive` alone, with a toast naming the
   * new state. Hiding is the reversible alternative to deleting — the image is
   * kept.
   */
  const toggleActive = (banner: AdminBanner) =>
    update(
      banner,
      { isActive: !banner.isActive },
      banner.isActive ? "Banner hidden from the app" : "Banner shown in the app",
    );

  // Move one place up (-1) or down (+1). The list moves at once; if the server
  // refuses, the previous order comes back.
  /**
   * Moves a banner one place up or down.
   *
   * @remarks
   * The app's only optimistic mutation. The two entries are swapped in local
   * state immediately, then the complete id order is sent to
   * `PUT /admin/settings/banners/order`; if that rejects, the captured previous
   * array is put back and the error is toasted.
   *
   * Order matters beyond appearance: it decides which live banners fall inside
   * the carousel limit, so a move can change another banner's status to or from
   * `overLimit`.
   *
   * A move that would run off either end of the list returns without a request.
   *
   * @param step - `-1` to move up, `1` to move down.
   */
  const move = async (banner: AdminBanner, step: -1 | 1) => {
    const from = items.findIndex((b) => b._id === banner._id);
    const to = from + step;
    if (from < 0 || to < 0 || to >= items.length) return;

    const previous = items;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setItems(next);

    try {
      setBusyId(banner._id);
      apply(await reorderAdminBanners(next.map((b) => b._id)));
    } catch (error) {
      setItems(previous);
      toast.error(message(error));
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Deletes a banner and its image.
   *
   * @remarks
   * `DELETE /admin/settings/banners/:id`. Not reversible. The confirmation
   * dialog lives in `BannerList`; this call does not prompt.
   *
   * @returns `true` on success, which closes that confirmation dialog.
   */
  const remove = async (banner: AdminBanner) => {
    try {
      setBusyId(banner._id);
      apply(await deleteAdminBanner(banner._id));
      toast.success("Banner deleted");
      return true;
    } catch (error) {
      toast.error(message(error));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return { items, limit, loading, uploading, busyId, refresh, upload, update, toggleActive, move, remove };
}
