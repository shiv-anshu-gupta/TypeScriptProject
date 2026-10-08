/**
 * Broadcast notifications: one push message sent to every customer who has
 * notifications on, at most once a day.
 *
 * @remarks
 * Not to be confused with `features/admin/notifications`, which registers this
 * browser to *receive* admin alerts. This module *sends* to customers' phones.
 *
 * The daily limit and the length limits are enforced by the server; the values
 * it reports in `limits` are what the page counts against.
 *
 * @packageDocumentation
 */
import { apiGet, apiPost } from "@/lib/api";

/** What the customer's app opens when they tap the notification. */
export type BroadcastTarget =
  | { type: "home" }
  | { type: "products" }
  | { type: "writeList" }
  | { type: "category"; targetId: string }
  | { type: "product"; targetId: string };

/** Every target type, in the order the "When tapped, open" select lists them. */
export type BroadcastTargetType = BroadcastTarget["type"];

/**
 * How the notification looks on the phone.
 *
 * - `text` - title and message, with the sKirana logo.
 * - `picture` - title and message plus a 2:1 picture (small, big when pulled down).
 * - `banner` - a 4:1 picture that is the whole notification.
 *
 * Title and message are required for all three: lock screens, screen readers
 * and app versions before 1.0.5 use them.
 */
export type BroadcastStyle = "text" | "picture" | "banner";

/** The shape a picture is uploaded for: 2:1 for `picture`, 4:1 for `banner`. */
export type BroadcastImageShape = Exclude<BroadcastStyle, "text">;

/** One sent broadcast, test or real. */
export type BroadcastHistoryItem = {
  _id: string;
  title: string;
  body: string;
  /**
   * `targetName` is not part of the agreed contract; it is read if the server
   * happens to send it, and the page falls back to its own lookup otherwise.
   */
  target: BroadcastTarget & { targetName?: string };
  kind: "test" | "all";
  /** How it looked; optional only for safety against an older server. */
  style?: BroadcastStyle;
  /** The picture it was sent with, or `null` for none. */
  imageUrl?: string | null;
  recipients: number;
  sentByEmail: string;
  createdAt: string;
};

/** `GET /admin/broadcasts`. */
export type BroadcastOverview = {
  /** Customers with notifications on — who "Send to everyone" reaches. */
  audience: number;
  canSendToday: boolean;
  nextAllowedAt: string | null;
  limits: { titleMax: number; bodyMax: number; perDay: number };
  history: BroadcastHistoryItem[];
};

/** Body of both send calls. */
export type BroadcastBody = {
  title: string;
  body: string;
  target: BroadcastTarget;
  /** Defaults to `text` on the server when left out. */
  style: BroadcastStyle;
  /**
   * The picture, as returned by {@link uploadBroadcastImage} with the matching
   * shape. Required for `picture` and `banner`; ignored for `text`.
   */
  imageUrl?: string;
};

/**
 * Uploads the picture for a notification.
 *
 * @remarks
 * `POST /admin/broadcasts/image?shape=…`, multipart, one file in the field
 * `image` (JPG, PNG or WebP, at most 5 MB). The server answers with a delivery
 * URL on the shop's Cloudinary, cropped to 1024x512 (2:1) for `picture` or
 * 1024x256 (4:1) for `banner`; the sends accept only such URLs.
 *
 * @throws Error carrying the server's message, e.g. a wrong type or size.
 */
export async function uploadBroadcastImage(file: File, shape: BroadcastImageShape) {
  const formData = new FormData();
  formData.append("shape", shape);
  formData.append("image", file);
  return apiPost<{ imageUrl: string }, FormData>(
    `/admin/broadcasts/image?shape=${shape}`,
    formData,
  );
}

/** Loads the audience size, today's allowance and the send history. */
export async function getBroadcastOverview() {
  return apiGet<BroadcastOverview>("/admin/broadcasts");
}

/**
 * Sends the message to the signed-in admin's own phone only.
 *
 * @throws The server's message — e.g. when this account has no phone
 * registered for notifications.
 */
export async function sendTestBroadcast(body: BroadcastBody) {
  return apiPost<{ recipients: number }, BroadcastBody>(
    "/admin/broadcasts/test",
    body,
  );
}

/**
 * Sends the message to every customer with notifications on.
 *
 * @throws The server's message — e.g. when today's one send is used up (429).
 */
export async function sendBroadcast(body: BroadcastBody) {
  return apiPost<{ recipients: number }, BroadcastBody>(
    "/admin/broadcasts",
    body,
  );
}
