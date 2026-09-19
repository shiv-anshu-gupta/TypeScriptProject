/**
 * Turns a priced grocery list into a message the shop can send the customer.
 *
 * @remarks
 * Backs the Share button in each grocery-list card's header. This is how the
 * shop sends a total to a customer outside the app — usually over WhatsApp.
 *
 * @packageDocumentation
 */
import type { AdminGroceryList } from "@/features/admin/grocery-lists/types";
import { formatPrice } from "@/lib/utils";

// Build a clean, WhatsApp-friendly text version of an order.
// `itemNames`, when given, overrides each line's name (used to share the
// Hindi/English-translated names when the worker has that view turned on).
/**
 * Formats an order as plain text: header, customer line, numbered items, total.
 *
 * @remarks
 * Plain text with no markup, because the destination is a WhatsApp message
 * body.
 *
 * Empty fields are omitted rather than shown blank: a line with no quantity
 * loses its separator, an unpriced line shows no price, and a list whose
 * `totalAmount` is zero gets no total line at all. Sharing an unpriced list is
 * therefore allowed and produces a plain shopping list.
 *
 * Note that an item marked out of stock still appears here. The server forces
 * its price to zero, so it reads as a name with no price beside it.
 *
 * @param list - The order to format.
 * @param itemNames - Replacement names in row order, used when the card's
 * Hindi and English toggle is on so the customer receives the translated
 * wording. Index-aligned with `list.items`; a blank or missing entry falls
 * back to the original name.
 * @returns The message body.
 */
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

  if (list.totalAmount > 0) {
    lines.push("");
    lines.push(`Total: ${formatPrice(list.totalAmount)}`);
  }

  return lines.join("\n");
}

// Share an order "by any means": use the native share sheet where available
// (mobile browsers → WhatsApp, etc.); otherwise open WhatsApp with the text
// pre-filled (works on desktop via WhatsApp Web / app).
/**
 * Opens the device share sheet for an order, falling back to WhatsApp.
 *
 * @remarks
 * On a phone `navigator.share` gives the shopkeeper the OS share sheet, so the
 * message can go to WhatsApp, SMS or anything else installed. Desktop browsers
 * mostly lack it, so the fallback opens `wa.me` in a new tab with the text
 * pre-filled.
 *
 * Neither path sends anything by itself, and neither confirms that anything was
 * sent. The shopkeeper still has to pick a recipient and press send. A
 * cancelled share sheet is swallowed on purpose — cancelling is not an error.
 *
 * Note that no phone number is passed to `wa.me`, so the fallback cannot
 * pre-select the customer even though the list holds their number.
 *
 * Resolves as soon as the sheet closes or the tab is opened. It does not wait
 * for, or report, delivery.
 *
 * @param list - The order to share.
 * @param itemNames - Optional translated names, as for
 * {@link buildListShareText}.
 */
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
