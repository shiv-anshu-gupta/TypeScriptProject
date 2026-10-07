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
};

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
