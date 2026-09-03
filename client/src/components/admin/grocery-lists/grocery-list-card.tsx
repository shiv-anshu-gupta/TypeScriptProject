import { useEffect, useMemo, useState } from "react";
import { Check, Languages, Pencil, Plus, Share2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type {
  AdminGroceryList,
  GroceryListStatus,
  UpdateGroceryListStatusBody,
} from "@/features/admin/grocery-lists/types";
import { cn, formatPrice } from "@/lib/utils";
import { shareList } from "@/lib/share-list";
import { translateItems } from "@/lib/translate";
import GroceryListChat from "./grocery-list-chat";
import PriceCalculator from "./price-calculator";

const cardClass = "border-border bg-card shadow-sm";
const headerRowClass = "flex flex-wrap items-start justify-between gap-3";
const codeClass = "text-sm font-semibold text-foreground";
const metaClass = "text-xs text-muted-foreground";

const itemIndexClass = "w-6 text-xs text-muted-foreground";

const totalRowClass = "flex items-center justify-between pt-1";
const totalLabelClass = "text-sm font-medium text-foreground";
const totalValueClass = "text-base font-semibold text-foreground";

const actionsRowClass = "flex flex-wrap gap-2 pt-1";

const statusLabel: Record<GroceryListStatus, string> = {
  received: "Received",
  priced: "Priced — sent to customer",
  packing: "Packing",
  packed: "Packed",
  ready: "Ready — come to receive",
  completed: "Completed",
  cancelled: "Cancelled",
};

// The order a list moves through. Progress is one-way: a step can only be
// clicked when it is the immediate next one, so the shopkeeper can never jump
// backwards (which previously made the buttons look like they toggled).
const STATUS_FLOW = [
  "priced",
  "packing",
  "packed",
  "ready",
  "completed",
] as const;

type FlowStatus = (typeof STATUS_FLOW)[number];

// The steps the shopkeeper actually clicks (everything after "priced",
// which is reached by sending prices rather than by a status button).
const FLOW_ACTIONS = STATUS_FLOW.filter(
  (status): status is Exclude<FlowStatus, "priced"> => status !== "priced",
);

// Buttons for these steps read as an action, not a state.
const actionLabel: Record<Exclude<FlowStatus, "priced">, string> = {
  packing: "Start packing",
  packed: "Mark packed",
  ready: "Ready to collect",
  completed: "Mark completed",
};

type GroceryListCardProps = {
  list: AdminGroceryList;
  draft: string[];
  rate: string[];
  draftTotal: number;
  saving: boolean;
  onPriceChange: (index: number, value: string) => void;
  onRateChange: (index: number, value: string) => void;
  onSavePrices: () => void;
  onChangeStatus: (status: UpdateGroceryListStatusBody["status"]) => void;
  onMarkPaid: () => void;
  onToggleAvailable: (index: number, available: boolean) => void;
  onAddItem: (name: string, quantity: string) => void;
  onEditItem: (index: number, name: string, quantity: string) => void;
};

function GroceryListCard({
  list,
  draft,
  rate,
  draftTotal,
  saving,
  onPriceChange,
  onRateChange,
  onSavePrices,
  onChangeStatus,
  onMarkPaid,
  onToggleAvailable,
  onAddItem,
  onEditItem,
}: GroceryListCardProps) {
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");

  // Inline edit of an existing item's name / quantity.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");

  const startEdit = (index: number, name: string, quantity: string) => {
    setEditingIndex(index);
    setEditName(name);
    setEditQty(quantity);
  };
  const cancelEdit = () => setEditingIndex(null);
  const submitEdit = () => {
    if (editingIndex === null || !editName.trim()) return;
    onEditItem(editingIndex, editName, editQty);
    setEditingIndex(null);
  };

  const submitNewItem = () => {
    if (!newName.trim()) return;
    onAddItem(newName, newQty);
    setNewName("");
    setNewQty("");
  };
  const isPriced = list.totalAmount > 0;
  const isPaid = list.paymentStatus === "paid";

  // Packing checklist: the shopkeeper ticks each item as they pack it, so
  // nothing gets missed. Kept in localStorage (per list) — it's a personal
  // packing aid on the shop's own device, so it survives page refreshes /
  // the 15s poll without needing any server change.
  const storageKey = `grocery-packed:${list._id}`;
  const [packed, setPacked] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return new Set<number>(raw ? (JSON.parse(raw) as number[]) : []);
    } catch {
      return new Set<number>();
    }
  });

  function togglePacked(index: number) {
    setPacked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // storage full / disabled — the checklist just won't persist
      }
      return next;
    });
  }

  const packedCount = list.items.reduce(
    (count, _item, index) => (packed.has(index) ? count + 1 : count),
    0,
  );
  const allPacked = list.items.length > 0 && packedCount === list.items.length;

  // Generic, dictionary-free translation of the customer's item names. Whatever
  // language a list comes in (English, Hindi or Hinglish), the worker can show
  // BOTH the Hindi and the English form of every item at once — auto-detected,
  // works for any word. The original always stays visible.
  const [showBoth, setShowBoth] = useState(false);
  const [hiNames, setHiNames] = useState<string[]>([]);
  const [enNames, setEnNames] = useState<string[]>([]);
  const namesKey = list.items.map((item) => item.name).join("|");

  useEffect(() => {
    if (!showBoth) {
      setHiNames([]);
      setEnNames([]);
      return;
    }
    let cancelled = false;
    const names = list.items.map((item) => item.name);
    void Promise.all([
      translateItems(names, "hi"),
      translateItems(names, "en"),
    ]).then(([hi, en]) => {
      if (!cancelled) {
        setHiNames(hi);
        setEnNames(en);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBoth, namesKey]);

  // When the worker has the Hindi+English view on, share the translated names
  // too (so a shared/WhatsApp'd order isn't stuck in the original language).
  const shareNames = useMemo(() => {
    if (!showBoth) return undefined;
    return list.items.map((item, index) => {
      const orig = item.name.trim().toLowerCase();
      const forms = [hiNames[index], enNames[index]]
        .filter((v): v is string => Boolean(v))
        .filter(
          (v, i, a) =>
            a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
        )
        .filter((v) => v.trim().toLowerCase() !== orig);
      return forms.length ? `${item.name} (${forms.join(" · ")})` : item.name;
    });
  }, [showBoth, hiNames, enNames, list.items]);

  // How far along the flow this list is. -1 for "received" (not priced yet).
  const currentIndex = STATUS_FLOW.indexOf(list.status as FlowStatus);

  // Cancelled or completed lists are finished — nothing further to do.
  const isClosed = list.status === "cancelled" || list.status === "completed";

  return (
    <Card className={cardClass}>
      <CardHeader className={headerRowClass}>
        <div className="space-y-1">
          <p className={codeClass}>
            List #{list.code} — {list.customerName || "Customer"}
          </p>
          {list.customerPhone ? (
            <p className={metaClass}>
              📞{" "}
              <a
                href={`tel:${list.customerPhone}`}
                className="font-medium text-foreground underline underline-offset-2"
              >
                {list.customerPhone}
              </a>
            </p>
          ) : null}
          {list.customerEmail ? (
            <p className={metaClass}>{list.customerEmail}</p>
          ) : null}
          <p className={metaClass}>
            {list.totalItems} item{list.totalItems > 1 ? "s" : ""} ·{" "}
            {new Date(list.updatedAt ?? list.createdAt).toLocaleString()}
          </p>
          {list.updatedAt &&
          new Date(list.updatedAt).toDateString() !==
            new Date(list.createdAt).toDateString() ? (
            <p className={metaClass}>
              first sent {new Date(list.createdAt).toLocaleDateString()}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="secondary">{statusLabel[list.status]}</Badge>
          {isPriced ? (
            <Badge
              variant={list.paymentStatus === "paid" ? "default" : "outline"}
            >
              {list.paymentStatus === "paid"
                ? "Payment received"
                : "Payment pending"}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => void shareList(list, shareNames)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Packing progress — tick each item as it's packed so none is missed */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Items — tick as you pack
          </span>
          <span
            className={
              allPacked
                ? "text-xs font-semibold text-green-600"
                : "text-xs font-medium text-muted-foreground"
            }
          >
            {allPacked
              ? "✓ All packed"
              : `${packedCount}/${list.items.length} packed`}
          </span>
        </div>

        {/* Show every item in BOTH Hindi and English (auto-detected), so any
            worker can read it whatever language the customer sent. */}
        <button
          type="button"
          onClick={() => setShowBoth((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-xs transition-colors",
            showBoth
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary/50",
          )}
        >
          <Languages className="h-3.5 w-3.5" />
          {showBoth ? "हिंदी + English ✓" : "Show हिंदी + English"}
        </button>

        <div className="space-y-2">
          {list.items.map((item, index) => {
            const isPacked = packed.has(index);
            const isUnavailable = item.available === false;

            // Inline edit form for this row's name / quantity.
            if (editingIndex === index) {
              return (
                <div
                  key={`${list._id}-${index}`}
                  className="flex flex-wrap items-center gap-2 border-b border-border/40 pb-2 last:border-0 last:pb-0"
                >
                  <span className={itemIndexClass}>{index + 1}.</span>
                  <Input
                    autoFocus
                    placeholder="Item name"
                    maxLength={60}
                    className="min-w-0 flex-1"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitEdit();
                      }
                    }}
                  />
                  <Input
                    placeholder="Qty"
                    maxLength={20}
                    className="w-20"
                    value={editQty}
                    onChange={(event) => setEditQty(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submitEdit();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving || !editName.trim()}
                    onClick={submitEdit}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={cancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            }

            return (
              <div
                key={`${list._id}-${index}`}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/40 pb-2 last:border-0 last:pb-0"
              >
                {/* Name group — full width on mobile so controls wrap below */}
                <div className="flex min-w-0 basis-full items-start gap-2 sm:flex-1 sm:basis-auto">
                  <button
                    type="button"
                    onClick={() => togglePacked(index)}
                    aria-label={isPacked ? "Mark not packed" : "Mark packed"}
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                      isPacked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background hover:border-primary/60",
                    )}
                  >
                    {isPacked ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                  <span className={cn(itemIndexClass, "mt-0.5")}>
                    {index + 1}.
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 break-words text-sm text-foreground",
                      (isPacked || isUnavailable) &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {item.name}
                    {showBoth
                      ? (() => {
                          const orig = item.name.trim().toLowerCase();
                          const forms = [hiNames[index], enNames[index]]
                            .filter((v): v is string => Boolean(v))
                            .filter(
                              (v, i, a) =>
                                a.findIndex(
                                  (x) => x.toLowerCase() === v.toLowerCase(),
                                ) === i,
                            )
                            .filter((v) => v.trim().toLowerCase() !== orig);
                          return forms.length ? (
                            <span className="ml-2 font-medium text-primary">
                              → {forms.join(" · ")}
                            </span>
                          ) : null;
                        })()
                      : null}
                  </span>
                </div>

                {/* Controls group — qty, price, out-of-stock */}
                <div className="ml-7 flex flex-shrink-0 flex-wrap items-center gap-2 sm:ml-0">
                  <span className="w-12 shrink-0 text-sm text-muted-foreground sm:w-14">
                    {item.quantity || "—"}
                  </span>
                  {isUnavailable ? (
                    <span className="text-xs font-semibold text-destructive">
                      Out of stock
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="Rate"
                        title="Price per unit — auto-fills the total (rate × qty)"
                        className="w-16"
                        value={rate[index] ?? ""}
                        onChange={(event) =>
                          onRateChange(index, event.target.value)
                        }
                      />
                      <span className="text-xs text-muted-foreground">=</span>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        placeholder="Total"
                        title="Line total"
                        className="w-20"
                        value={draft[index] ?? ""}
                        onChange={(event) =>
                          onPriceChange(index, event.target.value)
                        }
                      />
                      <PriceCalculator
                        quantity={item.quantity}
                        onResult={(value) => onPriceChange(index, value)}
                      />
                    </div>
                  )}
                  {!isClosed ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        startEdit(index, item.name, item.quantity)
                      }
                      title="Edit item name / quantity"
                      className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onToggleAvailable(index, isUnavailable)}
                    title={
                      isUnavailable
                        ? "Mark back in stock"
                        : "Mark out of stock (customer is notified)"
                    }
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-1 text-xs transition-colors disabled:opacity-50",
                      isUnavailable
                        ? "border-border text-muted-foreground hover:border-primary/50"
                        : "border-destructive/40 text-destructive hover:bg-destructive/5",
                    )}
                  >
                    {isUnavailable ? "Restore" : "Out of stock"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shop adds an item the customer told them later / in person */}
        {list.status !== "cancelled" && list.status !== "completed" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Add an item (e.g. Aata)"
              maxLength={60}
              className="min-w-0 flex-1"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitNewItem();
                }
              }}
            />
            <Input
              placeholder="Qty"
              maxLength={20}
              className="w-20"
              value={newQty}
              onChange={(event) => setNewQty(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitNewItem();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={saving || !newName.trim()}
              onClick={submitNewItem}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        ) : null}

        <Separator />

        <div className={totalRowClass}>
          <span className={totalLabelClass}>Total</span>
          <span className={totalValueClass}>{formatPrice(draftTotal)}</span>
        </div>

        <div className={actionsRowClass}>
          <Button onClick={onSavePrices} disabled={saving || isClosed}>
            {isPriced ? "Update prices" : "Send prices to customer"}
          </Button>

          {isPriced && !isPaid ? (
            <Button
              variant="default"
              disabled={saving}
              onClick={onMarkPaid}
            >
              Mark as paid
            </Button>
          ) : null}

          {isPriced && !isClosed
            ? FLOW_ACTIONS.map((status) => {
                const stepIndex = STATUS_FLOW.indexOf(status);
                const isDone = stepIndex <= currentIndex;
                const isNext = stepIndex === currentIndex + 1;

                return (
                  <Button
                    key={status}
                    variant={isNext ? "default" : "outline"}
                    // Only the immediate next step is actionable. Past steps
                    // are done, later steps aren't reachable yet.
                    disabled={saving || !isNext}
                    onClick={() => onChangeStatus(status)}
                  >
                    {isDone ? `✓ ${statusLabel[status]}` : actionLabel[status]}
                  </Button>
                );
              })
            : null}

          {/* Cancel is allowed at any stage before it's closed — including a
              still-unpriced "received" list (the server permits it). */}
          {!isClosed ? (
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => onChangeStatus("cancelled")}
            >
              Cancel order
            </Button>
          ) : null}
        </div>

        <GroceryListChat
          listId={list._id}
          customerName={list.customerName}
        />
      </CardContent>
    </Card>
  );
}

export default GroceryListCard;
