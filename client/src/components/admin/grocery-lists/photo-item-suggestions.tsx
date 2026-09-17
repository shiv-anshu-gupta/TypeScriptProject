import { useState } from "react";
import { AlertTriangle, Loader2, ScanText, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseAdminGroceryListPhotos } from "@/features/admin/grocery-lists/api";
import type { ParsedPhotoItem } from "@/features/admin/grocery-lists/types";
import { cn } from "@/lib/utils";

const blockClass = "border border-border bg-secondary/50 p-3";
const labelClass = "text-xs font-semibold text-foreground";
const hintClass = "mt-1 text-xs text-muted-foreground";

// One suggestion row while the shopkeeper reviews: editable, and included
// only while its checkbox stays ticked.
type DraftRow = ParsedPhotoItem & { included: boolean };

type PhotoItemSuggestionsProps = {
  listId: string;
  saving: boolean;
  onConfirm: (items: Array<{ name: string; quantity: string }>) => Promise<void>;
};

/**
 * "Read items from photos" — AI turns the customer's handwritten-list photos
 * into item suggestions. The suggestions are ONLY a draft: every row is
 * editable, uncertain rows are flagged, and nothing reaches the list until
 * the shopkeeper presses Add. If the AI is down or wrong, typing items by
 * hand (the row below) keeps working exactly as before.
 */
function PhotoItemSuggestions({
  listId,
  saving,
  onConfirm,
}: PhotoItemSuggestionsProps) {
  const [reading, setReading] = useState(false);
  const [rows, setRows] = useState<DraftRow[] | null>(null);

  const readPhotos = async () => {
    try {
      setReading(true);
      const response = await parseAdminGroceryListPhotos(listId);
      const suggestions = response?.suggestions ?? [];
      if (!suggestions.length) {
        toast.error(
          "No items could be read from the photos — add them by hand.",
        );
        return;
      }
      setRows(suggestions.map((item) => ({ ...item, included: true })));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not read the photos",
      );
    } finally {
      setReading(false);
    }
  };

  const updateRow = (index: number, patch: Partial<DraftRow>) =>
    setRows((prev) =>
      prev ? prev.map((row, i) => (i === index ? { ...row, ...patch } : row)) : prev,
    );

  const selected = (rows ?? []).filter(
    (row) => row.included && row.name.trim().length >= 2,
  );

  const confirm = async () => {
    if (!selected.length) return;
    try {
      await onConfirm(
        selected.map((row) => ({ name: row.name, quantity: row.quantity })),
      );
      setRows(null);
      toast.success(
        `${selected.length} item${selected.length > 1 ? "s" : ""} added — now set the prices.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add the items",
      );
    }
  };

  // Closed state: just the button that starts a read.
  if (!rows) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={reading || saving}
        onClick={readPhotos}
      >
        {reading ? (
          <>
            <Loader2 className="animate-spin" /> Reading photos…
          </>
        ) : (
          <>
            <ScanText /> Read items from photos
          </>
        )}
      </Button>
    );
  }

  const uncertainCount = rows.filter(
    (row) => row.included && row.confidence === "low",
  ).length;

  return (
    <section className={blockClass}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ScanText className="size-4 text-muted-foreground" />
          <span className={labelClass}>Items read from the photos</span>
          <Badge variant="outline">{rows.length}</Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Discard suggestions"
          onClick={() => setRows(null)}
        >
          <X />
        </Button>
      </div>
      <p className={hintClass}>
        Check each line against the photo — fix or untick anything wrong, then
        add. Nothing goes on the order until you add it.
      </p>
      {uncertainCount ? (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600">
          <AlertTriangle className="size-3.5 shrink-0" />
          {uncertainCount} line{uncertainCount > 1 ? "s were" : " was"} hard to
          read — check those against the photo.
        </p>
      ) : null}

      <div className="mt-2 space-y-1.5">
        {rows.map((row, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 border p-1.5",
              row.confidence === "low" && row.included
                ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
                : "border-border bg-card",
              !row.included && "opacity-50",
            )}
          >
            <input
              type="checkbox"
              checked={row.included}
              onChange={(event) =>
                updateRow(index, { included: event.target.checked })
              }
              aria-label={`Include ${row.name || "this item"}`}
              className="size-4 shrink-0 accent-primary"
            />
            <Input
              value={row.name}
              onChange={(event) => updateRow(index, { name: event.target.value })}
              maxLength={60}
              className="h-8 flex-1 text-sm"
              aria-label="Item name"
            />
            <Input
              value={row.quantity}
              onChange={(event) =>
                updateRow(index, { quantity: event.target.value })
              }
              maxLength={12}
              placeholder="Qty"
              className="h-8 w-24 text-sm"
              aria-label="Quantity"
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={saving || !selected.length}
          onClick={confirm}
        >
          {saving ? <Loader2 className="animate-spin" /> : null}
          Add {selected.length} item{selected.length === 1 ? "" : "s"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={() => setRows(null)}
        >
          Discard
        </Button>
      </div>
    </section>
  );
}

export default PhotoItemSuggestions;
