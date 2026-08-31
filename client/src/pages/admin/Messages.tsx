import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminConversations } from "@/features/admin/grocery-lists/api";
import type { AdminConversation } from "@/features/admin/grocery-lists/types";
import GroceryListChat from "@/components/admin/grocery-lists/grocery-list-chat";

// All customer conversations in one place, so the shop can reply without
// hunting through orders. Polls every 15s while open.
function AdminMessages() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

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
