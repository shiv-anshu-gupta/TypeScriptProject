// Telegram push for the shopkeeper — a free, reliable "new order" alert that
// reaches their phone even when the admin laptop is closed. Configure via env:
//   TELEGRAM_BOT_TOKEN   — from @BotFather
//   TELEGRAM_CHAT_ID     — one or more chat IDs, comma-separated (father, son…)
// No-op (silent) if not configured, and never throws — a notification failure
// must not break the customer's request.
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
