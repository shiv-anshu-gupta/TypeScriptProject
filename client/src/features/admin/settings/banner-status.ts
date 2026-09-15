import type { AdminBanner, BannerLinkType, BannerStatus } from "./types";

// The app's banner shape: 1600 x 736 (height = 0.46 x width).
export const BANNER_WIDTH = 1600;
export const BANNER_HEIGHT = 736;
export const BANNER_RATIO = BANNER_HEIGHT / BANNER_WIDTH;
export const MAX_BANNER_BYTES = 5 * 1024 * 1024;
export const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Status of every banner, in list order. "Live" banners beyond the carousel's
// limit are reported as overLimit - they're on, but the app won't show them.
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

export const LINK_LABELS: Record<BannerLinkType, string> = {
  none: "Nothing (image only)",
  writeList: "Write-list sheet",
  shop: "Shop tab",
  category: "A category",
  product: "A product",
};

export function linkSummary(banner: AdminBanner) {
  const { type, targetName } = banner.link;
  if (type === "category") return targetName ? `Category: ${targetName}` : "Category (deleted)";
  if (type === "product") return targetName ? `Product: ${targetName}` : "Product (deleted)";
  if (type === "none") return "Not tappable";
  return LINK_LABELS[type];
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function scheduleSummary(banner: AdminBanner) {
  const from = banner.startsAt ? dateFormat.format(new Date(banner.startsAt)) : null;
  const to = banner.endsAt ? dateFormat.format(new Date(banner.endsAt)) : null;
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return "Always";
}

// <input type="datetime-local"> works in local time without a zone.
export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}
