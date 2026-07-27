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
import { formatPrice } from "@/lib/utils";

const cardClass = "border-border bg-card shadow-sm";
const headerRowClass = "flex flex-wrap items-start justify-between gap-3";
const codeClass = "text-sm font-semibold text-foreground";
const metaClass = "text-xs text-muted-foreground";

const itemRowClass = "flex items-center gap-3";
const itemIndexClass = "w-6 text-xs text-muted-foreground";
const itemNameClass = "flex-1 text-sm text-foreground";
const itemQtyClass = "w-24 text-sm text-muted-foreground";
const priceInputClass = "w-28";

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
  draftTotal: number;
  saving: boolean;
  onPriceChange: (index: number, value: string) => void;
  onSavePrices: () => void;
  onChangeStatus: (status: UpdateGroceryListStatusBody["status"]) => void;
  onMarkPaid: () => void;
};

function GroceryListCard({
  list,
  draft,
  draftTotal,
  saving,
  onPriceChange,
  onSavePrices,
  onChangeStatus,
  onMarkPaid,
}: GroceryListCardProps) {
  const isPriced = list.totalAmount > 0;
  const isPaid = list.paymentStatus === "paid";

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
          {list.customerEmail ? (
            <p className={metaClass}>{list.customerEmail}</p>
          ) : null}
          <p className={metaClass}>
            {list.totalItems} item{list.totalItems > 1 ? "s" : ""} ·{" "}
            {new Date(list.createdAt).toLocaleString()}
          </p>
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
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {list.items.map((item, index) => (
            <div key={`${list._id}-${index}`} className={itemRowClass}>
              <span className={itemIndexClass}>{index + 1}.</span>
              <span className={itemNameClass}>{item.name}</span>
              <span className={itemQtyClass}>{item.quantity || "—"}</span>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Price"
                className={priceInputClass}
                value={draft[index] ?? ""}
                onChange={(event) => onPriceChange(index, event.target.value)}
              />
            </div>
          ))}
        </div>

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

          {isPriced && !isClosed ? (
            <Button
              variant="destructive"
              disabled={saving}
              onClick={() => onChangeStatus("cancelled")}
            >
              Cancel order
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default GroceryListCard;
