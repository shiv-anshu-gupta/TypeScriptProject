# sendTelegram `telegram`

The shopkeeper's out-of-band order alert.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/telegram.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`sendTelegram`](#function-send-telegram) | Function | `function sendTelegram(text: string): Promise<void>` | Telegram push for the shopkeeper — a free, reliable "new order" alert that reaches their phone even when the admin laptop is closed. |

## Exports in detail

### `sendTelegram` {#function-send-telegram}

*Function*

Telegram push for the shopkeeper — a free, reliable "new order" alert that
reaches their phone even when the admin laptop is closed. Configure via env:

```
TELEGRAM_BOT_TOKEN   — from @BotFather
TELEGRAM_CHAT_ID     — one or more chat IDs, comma-separated (father, son…)
```

No-op (silent) if not configured, and never throws — a notification failure
must not break the customer's request.

```ts
function sendTelegram(text: string): Promise<void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `text` | `string` | sent with `parse_mode: "HTML"`, so Telegram's small tag set (`<b>`, `<i>`, `<code>`…) works — and any raw `<` or `&` in customer text must be escaped by the caller or Telegram rejects the message. |

**Returns** `Promise<void>`

One message is sent per chat id, all at once, to Telegram's
`sendMessage` API. Each send swallows its own failure, so one bad chat id
does not stop the others.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/telegram.ts#L28)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/telegram.ts)
