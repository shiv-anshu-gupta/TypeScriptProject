/**
 * Where a tapped notification should take the customer.
 *
 * @remarks
 * Pure on purpose: it reads a notification's `data` and says where to go, and
 * leaves doing the navigating to `openNotificationRoute`. That keeps the
 * decision testable without React, a navigator or a phone.
 *
 * `data` comes from the server, possibly a newer server than this app, so it
 * is treated as `unknown` and anything unrecognised maps to `null` — a tap
 * that does nothing beats a crash.
 *
 * @packageDocumentation
 */

/** Where a notification tap leads. */
export type NotificationRoute =
  | { kind: "home" }
  | { kind: "shop" }
  | { kind: "writeList" }
  | { kind: "category"; categoryId: string }
  | { kind: "product"; productId: string }
  | { kind: "lists" };

function asRecord(data: unknown): Record<string, unknown> | null {
  return data !== null && typeof data === "object" && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * Whether this notification is about one of the customer's orders — the only
 * kind that should make the app reload their lists. A shop-wide broadcast
 * (an offer, news) never is.
 */
export function isOrderNotification(data: unknown): boolean {
  const record = asRecord(data);
  if (!record || record.type === "broadcast") return false;
  return nonEmptyString(record.listId) !== null;
}

/**
 * Maps a notification's `data` to where tapping it should go.
 *
 * @param data - `notification.request.content.data`, as received.
 * @returns The destination, or `null` when the data is not understood (or a
 * category/product broadcast arrived without its id).
 */
export function routeFromNotification(data: unknown): NotificationRoute | null {
  const record = asRecord(data);
  if (!record) return null;

  if (record.type === "broadcast") {
    const targetId = nonEmptyString(record.targetId);
    switch (record.target) {
      case "home":
        return { kind: "home" };
      case "products":
        return { kind: "shop" };
      case "writeList":
        return { kind: "writeList" };
      case "category":
        return targetId ? { kind: "category", categoryId: targetId } : null;
      case "product":
        return targetId ? { kind: "product", productId: targetId } : null;
      default:
        return null;
    }
  }

  if (isOrderNotification(record)) return { kind: "lists" };

  return null;
}
