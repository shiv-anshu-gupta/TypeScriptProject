/**
 * `/admin/messages` — every customer conversation in one list.
 *
 * @remarks
 * A second way into the same chat threads that already appear inside each
 * grocery-list card. It exists so the shop can answer messages without first
 * finding the order they belong to.
 *
 * @packageDocumentation
 */
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminConversations } from "@/features/admin/grocery-lists/api";
import type { AdminConversation } from "@/features/admin/grocery-lists/types";
import GroceryListChat from "@/components/admin/grocery-lists/grocery-list-chat";

// All customer conversations in one place, so the shop can reply without
// hunting through orders. Polls every 15s while open.
/**
 * Lists every conversation, newest activity first, and opens one in place.
 *
 * @remarks
 * Loads `GET /admin/grocery-lists/conversations` on mount and then every 15
 * seconds, matching the grocery-lists page. A failed poll is caught and
 * ignored on purpose, so a momentary network problem does not blank a list the
 * shopkeeper is reading — which also means an outage is invisible here.
 *
 * Each row shows the customer, the order code, their phone, and the last
 * message. A `You:` prefix marks a message the shop sent, and a "reply" pill
 * marks one from the customer — that pill is the page's only cue that something
 * still needs an answer. It is derived purely from who spoke last, so it does
 * not disappear when the shopkeeper reads the message, only when they reply.
 *
 * Opening a row mounts `GroceryListChat` with `startOpen`, so it inherits that
 * component's own 5-second message poll. Only one row is open at a time, and
 * closing it unmounts the chat and stops that poll.
 *
 * The open row is local state, so it is forgotten on navigation or reload.
 *
 * @returns The messages screen.
 */
function AdminMessages() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  /**
   * Fetches the conversation summaries.
   *
   * @remarks
   * Errors are swallowed so a failed poll leaves the current rows in place. The
   * loading message is only shown when there is nothing to show yet.
   *
   * @param silent - `true` for a background poll, which leaves the loading flag
   * alone.
   */
  async function load(silent = false) {
    try {
      if (!silent) setLoading(true);
      const res = await getAdminConversations();
      setConversations(res?.conversations ?? []);
    } catch {
      // a failed poll shouldn't wipe the list
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 15000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !conversations.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : !conversations.length ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No customer messages yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((c) => {
                const isOpen = openId === c.listId;
                const fromCustomer = c.lastMessage.sender === "customer";
                return (
                  <div key={c.listId} className="py-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : c.listId)}
                      className="flex w-full items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {c.customerName || "Customer"} · #{c.code}
                          {c.customerPhone ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              📞 {c.customerPhone}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {fromCustomer ? "" : "You: "}
                          {c.lastMessage.text}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.lastMessage.createdAt).toLocaleString()}
                        </span>
                        {fromCustomer ? (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            reply
                          </span>
                        ) : null}
                      </div>
                    </button>
                    {isOpen ? (
                      <div className="mt-2">
                        <GroceryListChat
                          listId={c.listId}
                          customerName={c.customerName}
                          startOpen
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminMessages;
