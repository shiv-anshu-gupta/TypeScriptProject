/**
 * The shopkeeper's out-of-band order alert.
 *
 * @packageDocumentation
 */

/**
 * Telegram push for the shopkeeper — a free, reliable "new order" alert that
 * reaches their phone even when the admin laptop is closed. Configure via env:
 *
 * ```
 * TELEGRAM_BOT_TOKEN   — from @BotFather
 * TELEGRAM_CHAT_ID     — one or more chat IDs, comma-separated (father, son…)
 * ```
 *
 * No-op (silent) if not configured, and never throws — a notification failure
 * must not break the customer's request.
 *
 * @remarks
 * One message is sent per chat id, all at once, to Telegram's
 * `sendMessage` API. Each send swallows its own failure, so one bad chat id
 * does not stop the others.
 *
 * @param text - sent with `parse_mode: "HTML"`, so Telegram's small tag set
 * (`<b>`, `<i>`, `<code>`…) works. Anything a customer typed - their name, a
 * chat message, an item - must go through {@link escapeTelegram} first.
 */
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const raw = process.env.TELEGRAM_CHAT_ID;
  if (!token || !raw) return;

  const chatIds = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!chatIds.length) return;

  await Promise.all(
    chatIds.map((chat_id) =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }).catch(() => undefined),
    ),
  );
}

/**
 * Makes customer-typed text safe to put inside a Telegram HTML message.
 *
 * @remarks
 * Without this, a customer could write `<a href="...">Payment received - tap
 * to confirm</a>` as a chat message and it would arrive in the shopkeeper's
 * Telegram as a real, tappable link that looks like it came from the shop's
 * own bot. Escaping turns it back into the harmless text it was typed as.
 *
 * Telegram's HTML mode needs exactly these three replaced.
 */
export function escapeTelegram(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
