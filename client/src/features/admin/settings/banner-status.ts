/**
 * Banner shape constants, upload limits, and the local rules that decide what
 * the app will do with each banner.
 *
 * @remarks
 * Nothing here calls the server. `bannerStatuses` reproduces the app's own
 * selection rules in the browser so the admin page can show, before any
 * request, which banners are live and which are not.
 *
 * The size and type constants are also the uploader's validation limits. The
 * server enforces matching caps for banners
 * (`server/src/routes/admin/settings.routes.ts`), which is not true of product
 * images — banners are the correctly-gated upload path.
 *
 * @packageDocumentation
 */

import type { AdminBanner, BannerLinkType, BannerStatus } from "./types";

// The app's banner shape: 1600 x 736 (height = 0.46 x width).
/**
 * Target banner width in pixels.
 *
 * @remarks
 * Advisory, not enforced: a narrower image only produces a warning in the
 * uploader, because the app crops to fit. Also used as the `aspect-ratio`
 * numerator in every banner thumbnail.
 */
export const BANNER_WIDTH = 1600;

/** Target banner height in pixels, paired with {@link BANNER_WIDTH}. */
export const BANNER_HEIGHT = 736;

/**
 * Banner height divided by width, 0.46.
 *
 * @remarks
 * Used by the uploader to judge how far off a picked file's shape is, and by
 * the phone preview to size each slide from its width.
 */
export const BANNER_RATIO = BANNER_HEIGHT / BANNER_WIDTH;

/**
 * Per-file upload ceiling, 5 MB.
 *
 * @remarks
 * A blocking error in the uploader. The server applies the same 5 MB cap, so
 * this is a duplicate of a real limit rather than the only defence.
 *
 * Banners are **not** compressed in the browser: they never go through
 * `client/src/lib/image.ts`, unlike product and category images. They are
 * validated and uploaded as-is.
 */
export const MAX_BANNER_BYTES = 5 * 1024 * 1024;

/**
 * Accepted MIME types.
 *
 * @remarks
 * Doubles as the file input's `accept` attribute and as the uploader's blocking
 * type check. The server checks the same three types, but from the
 * client-declared MIME type — there is no magic-byte sniffing.
 */
export const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Status of every banner, in list order. "Live" banners beyond the carousel's
// limit are reported as overLimit - they're on, but the app won't show them.
/**
 * Works out the status of every banner, in list order.
 *
 * @remarks
 * Computed entirely in the browser — the server never sends a status. The rules
 * are checked in order: inactive is `hidden`; a future `startsAt` is
 * `scheduled`; a past-or-equal `endsAt` is `ended`; otherwise it counts as live.
 * A banner with neither date set is live as soon as it is active.
 *
 * Live banners are counted as they are found, and any beyond `limit` are
 * reported as `overLimit`: they are switched on, but the app's carousel will not
 * reach them. The server does not refuse to store more than `limit` banners, so
 * `overLimit` exists to surface an advisory cap that nothing else enforces.
 *
 * @param items - Banners in their stored order; order decides which live banner
 * falls past the limit.
 * @param limit - Live banners the app's carousel shows, taken from the server's
 * response (8 at the time of writing) with 8 as the client fallback.
 * @param now - Reference time, injectable for tests. It defaults at call time,
 * so a memoised result does not re-evaluate schedules on its own.
 * @returns One status per banner, positionally aligned with `items`.
 */
export function bannerStatuses(items: AdminBanner[], limit: number, now = new Date()) {
  let liveCount = 0;
  return items.map((banner): BannerStatus => {
    if (!banner.isActive) return "hidden";
    if (banner.startsAt && new Date(banner.startsAt) > now) return "scheduled";
    if (banner.endsAt && new Date(banner.endsAt) <= now) return "ended";
    liveCount += 1;
    return liveCount > limit ? "overLimit" : "live";
  });
}

/**
 * Human labels for each link type, shown in the edit dialog's dropdown and
 * reused by {@link linkSummary}.
 *
 * @remarks
 * Typed as a full `Record`, so adding a member to `BannerLinkType` will not
 * compile until a label is added here.
 */
export const LINK_LABELS: Record<BannerLinkType, string> = {
  none: "Nothing (image only)",
  writeList: "Write-list sheet",
  shop: "Shop tab",
  category: "A category",
  product: "A product",
};

/**
 * One line describing what a banner opens when tapped.
 *
 * @remarks
 * Category and product links carry a `targetName` resolved by the server. When
 * that name is missing the target has been deleted, and the summary says so
 * ("Category (deleted)") rather than showing a blank — the app cannot open it
 * either. Every other type falls through to {@link LINK_LABELS}.
 *
 * @param banner - The banner whose `link` is described.
 * @returns Text for the banner row.
 */
export function linkSummary(banner: AdminBanner) {
  const { type, targetName } = banner.link;
  if (type === "category") return targetName ? `Category: ${targetName}` : "Category (deleted)";
  if (type === "product") return targetName ? `Product: ${targetName}` : "Product (deleted)";
  if (type === "none") return "Not tappable";
  return LINK_LABELS[type];
}

/**
 * Formatter used by {@link scheduleSummary}.
 *
 * @remarks
 * Built once at module load. The locale is pinned to `en-IN`, but the time zone
 * is not pinned, so it follows the browser's.
 */
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * One line describing when a banner shows.
 *
 * @remarks
 * Four cases: both dates give a range, one gives "From …" or "Until …", and
 * neither gives "Always". Dates are formatted `en-IN` with day, short month and
 * a 2-digit minute, in the browser's time zone — a shop device on IST reads
 * these as IST.
 *
 * This describes the stored schedule only. Whether the banner is actually
 * visible also depends on `isActive` and the carousel limit; that is
 * {@link bannerStatuses}.
 *
 * @param banner - The banner whose schedule is described.
 * @returns Text for the banner row.
 */
export function scheduleSummary(banner: AdminBanner) {
  const from = banner.startsAt ? dateFormat.format(new Date(banner.startsAt)) : null;
  const to = banner.endsAt ? dateFormat.format(new Date(banner.endsAt)) : null;
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return "Always";
}

// <input type="datetime-local"> works in local time without a zone.
/**
 * Converts a stored ISO timestamp into a value for
 * `<input type="datetime-local">`.
 *
 * @remarks
 * The input has no time zone, so the parts are read with local-time getters and
 * the admin sees their own clock. {@link fromLocalInput} reverses it. `null`
 * becomes an empty string, which is how "no date set" is represented in the
 * dialog.
 *
 * @param iso - Stored `startsAt` or `endsAt`, or `null`.
 * @returns A `YYYY-MM-DDTHH:mm` string, or `""`.
 */
export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Converts a `datetime-local` input value back to an ISO timestamp.
 *
 * @remarks
 * `new Date(value)` reads the zone-less string as local time, so this is the
 * exact inverse of {@link toLocalInput}. An empty field becomes `null`, which
 * is what clears a schedule on the server.
 *
 * @param value - The input's value, possibly empty.
 * @returns An ISO string, or `null` to clear the date.
 */
export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}
