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
const POLL_MS = 5000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

type GroceryListChatProps = {
  listId: string;
  customerName: string;
};

function GroceryListChat({ listId, customerName }: GroceryListChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
