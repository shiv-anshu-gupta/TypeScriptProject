import type { AdminGroceryList } from "@/features/admin/grocery-lists/types";
import { formatPrice } from "@/lib/utils";

// Build a clean, WhatsApp-friendly text version of an order.
// `itemNames`, when given, overrides each line's name (used to share the
// Hindi/English-translated names when the worker has that view turned on).
export function buildListShareText(
  list: AdminGroceryList,
  itemNames?: string[],
): string {
  const lines: string[] = [];
  lines.push(`🛒 Order #${list.code}`);

  const who = [list.customerName, list.customerPhone]
    .filter(Boolean)
    .join(" · ");
  if (who) lines.push(who);

  lines.push("");
  list.items.forEach((item, index) => {
    const name = itemNames?.[index]?.trim() || item.name;
    const qty = item.quantity ? ` · ${item.quantity}` : "";
    const price = item.price ? ` — ${formatPrice(item.price)}` : "";
    lines.push(`${index + 1}. ${name}${qty}${price}`);
  });

  // An order can be photos only (a handwritten list the customer sent). Say
  // so, or the shared text reads like an order with nothing in it.
  const photoCount = list.photos?.length ?? 0;
  if (photoCount) {
    if (!list.items.length) {
      lines.push(`(No typed items - ${photoCount} photo${photoCount > 1 ? "s" : ""} sent in the app)`);
    } else {
      lines.push("");
      lines.push(`+ ${photoCount} photo${photoCount > 1 ? "s" : ""} in the app`);
    }
  }

  if (list.totalAmount > 0) {
    lines.push("");
    lines.push(`Total: ${formatPrice(list.totalAmount)}`);
  }

  return lines.join("\n");
}

// Share an order "by any means": use the native share sheet where available
// (mobile browsers → WhatsApp, etc.); otherwise open WhatsApp with the text
// pre-filled (works on desktop via WhatsApp Web / app).
export async function shareList(
  list: AdminGroceryList,
  itemNames?: string[],
): Promise<void> {
  const text = buildListShareText(list, itemNames);
  const title = `Order #${list.code}`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text });
    } catch {
      // user cancelled the share sheet — nothing to do
    }
    return;
  }

  // Fallback: WhatsApp with the message pre-filled.
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
}
