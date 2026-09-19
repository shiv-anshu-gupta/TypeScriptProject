/**
 * The chat thread between the shop and one customer about one order.
 *
 * @remarks
 * Mounted twice over: collapsed at the bottom of every grocery-list card, and
 * expanded inside each row of the Messages page. Both use this same component,
 * so a change here affects both screens.
 *
 * @packageDocumentation
 */
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ChatMessage } from "@/features/admin/grocery-lists/types";
import {
  getAdminGroceryListMessages,
  sendAdminGroceryListMessage,
} from "@/features/admin/grocery-lists/api";

// Poll for new messages only while the panel is open — no background work.
/**
 * Message poll interval, in milliseconds.
 *
 * @remarks
 * Five seconds, three times faster than the orders poll, because a chat is a
 * live conversation. It runs only while the panel is open, so a page of
 * collapsed cards issues no chat requests at all.
 */
const POLL_MS = 5000;

/**
 * Formats a message timestamp as time plus day and month.
 *
 * @remarks
 * No year, since an order's conversation lasts hours rather than months.
 *
 * @param iso - ISO timestamp from the server.
 * @returns A short local-time string.
 */
function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

/** Props for {@link GroceryListChat}. */
type GroceryListChatProps = {
  /** The order's `_id`; the thread is keyed to the order, not the customer. */
  listId: string;
  /** Shown in the empty state only. Falls back to "this customer" when blank. */
  customerName: string;
  /**
   * Start expanded, and therefore start polling straight away.
   *
   * @remarks
   * The Messages page passes this, because a row is only rendered after the
   * shopkeeper has opened it. The grocery-list card leaves it off, so a page of
   * cards makes no chat requests until one is opened.
   *
   * It sets the initial state only. Changing it later does not reopen a panel
   * the shopkeeper has closed.
   */
  startOpen?: boolean;
};

/**
 * Shows and sends messages for one order.
 *
 * @remarks
 * Collapsed by default. Opening it loads the thread and starts a
 * {@link POLL_MS} poll; closing it clears the interval. Nothing polls while the
 * panel is shut, which is what keeps a page of a dozen cards cheap.
 *
 * The poll refetches the entire thread each time — there is no incremental
 * fetch — so a long conversation is re-read every five seconds.
 *
 * **Sending is the one optimistic action on this screen.** The input is cleared
 * before the request resolves, so the box feels immediate; if the send fails the
 * text is put back and a toast explains why. Nothing is queued and nothing is
 * retried, so a failed message is simply not sent. Enter sends, Shift+Enter
 * does not.
 *
 * Scrolling is deliberately confined to the message box: the effect sets
 * `scrollTop` on the container rather than calling `scrollIntoView`. The
 * earlier version scrolled the whole admin page on every five-second poll,
 * which yanked the shopkeeper's position around while they were pricing. Do not
 * reintroduce `scrollIntoView` here.
 *
 * A failed poll is caught and ignored, so an open conversation is never blanked
 * by a momentary network problem — and equally, an outage shows no error.
 *
 * @returns The chat toggle, and the thread when open.
 */
function GroceryListChat({
  listId,
  customerName,
  startOpen = false,
}: GroceryListChatProps) {
  const [open, setOpen] = useState(startOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Fetches the whole thread.
   *
   * @remarks
   * Errors are swallowed, so a failed poll leaves the visible conversation
   * alone.
   *
   * @param silent - `true` for a background poll, which leaves the loading flag
   * alone so the thread does not flicker every five seconds.
   */
  async function load(silent = false) {
    try {
      if (!silent) setLoading(true);
      const res = await getAdminGroceryListMessages(listId);
      setMessages(res?.messages ?? []);
    } catch {
      // a failed poll shouldn't disrupt the open conversation
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Load + poll only while the panel is open; stop the interval when closed.
  useEffect(() => {
    if (!open) return;
    void load();
    const timer = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listId]);

  // Keep the newest message in view, but scroll ONLY inside the chat box —
  // never the page. (The old scrollIntoView scrolled the whole admin page on
  // every 5s poll, which yanked the scroll position up and down.)
  useEffect(() => {
    const el = scrollRef.current;
    if (open && el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  /**
   * Sends the typed message.
   *
   * @remarks
   * Clears the input before awaiting the request, and restores the text with a
   * toast if it fails — the only optimistic behaviour on this screen. There is
   * no queue and no retry.
   *
   * Blank input is ignored, and the `sending` flag prevents a double send from
   * a fast second press of Enter.
   *
   * After a successful send it refetches silently rather than appending the
   * returned message, so the thread stays exactly as the server has it.
   */
  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setText("");
    try {
      await sendAdminGroceryListMessage(listId, body);
      await load(true);
    } catch (error) {
      setText(body);
      toast.error(
        error instanceof Error ? error.message : "Couldn't send message",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-3">
      <Separator />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-2 px-2 text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <MessageCircle className="h-4 w-4" />
        {open ? "Hide messages" : "Messages"}
      </Button>

      {open ? (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div
            ref={scrollRef}
            className="max-h-64 space-y-2 overflow-y-auto pr-1"
          >
            {loading && !messages.length ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Loading…
              </p>
            ) : messages.length ? (
              messages.map((m) => {
                const mine = m.sender === "staff";
                return (
                  <div
                    key={m._id}
                    className={mine ? "flex justify-end" : "flex justify-start"}
                  >
                    <div
                      className={
                        mine
                          ? "max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-3 py-1.5 text-sm text-primary-foreground"
                          : "max-w-[75%] rounded-2xl rounded-bl-sm border border-border bg-card px-3 py-1.5 text-sm text-foreground"
                      }
                    >
                      <p>{m.text}</p>
                      <p
                        className={
                          mine
                            ? "mt-0.5 text-[10px] text-primary-foreground/70"
                            : "mt-0.5 text-[10px] text-muted-foreground"
                        }
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No messages yet with {customerName || "this customer"}.
              </p>
            )}
          </div>

          <div className="flex items-end gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              placeholder="Reply to the customer…"
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              disabled={!text.trim() || sending}
              onClick={() => void onSend()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default GroceryListChat;
