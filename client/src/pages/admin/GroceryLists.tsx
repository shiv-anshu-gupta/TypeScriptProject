import GroceryListCard from "@/components/admin/grocery-lists/grocery-list-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useAdminGroceryLists,
  type StatusTab,
} from "@/features/admin/grocery-lists/use-admin-grocery-lists";
import { cn } from "@/lib/utils";

const pageWrapClass = "space-y-6 p-6";
const cardClass = "border-border bg-card shadow-sm";
const cardHeaderClass = "space-y-4";
const cardTitleClass = "text-xl";
const searchInputClass = "max-w-sm";
const emptyStateClass = "py-10 text-center text-sm text-muted-foreground";
const listStackClass = "space-y-4";

function AdminGroceryLists() {
  const {
    search,
    setSearch,
    amountReceived,
    setAmountReceived,
    amountMatchCount,
    lists,
    loading,
    savingListId,
    getDraft,
    updateDraftPrice,
    getRate,
    updateRate,
    getDraftTotal,
    savePrices,
    changeStatus,
    markPaid,
    setItemAvailability,
    addItem,
    statusTab,
    setStatusTab,
    statusCounts,
  } = useAdminGroceryLists();

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: statusCounts.active },
    { key: "completed", label: "Completed", count: statusCounts.completed },
    { key: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
  ];

  return (
    <div className={pageWrapClass}>
      <Card className={cardClass}>
        <CardHeader className={cardHeaderClass}>
          <CardTitle className={cardTitleClass}>Grocery lists</CardTitle>

          {/* Status tabs — keep cancelled / completed out of the active view */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusTab(tab.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  statusTab === tab.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/50",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 text-xs",
                    statusTab === tab.key
                      ? "bg-primary-foreground/20"
                      : "bg-muted",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Money-received matcher — got a UPI payment? Type the amount to
              find the order to mark paid. */}
          <div className="rounded-xl border border-primary/30 bg-secondary/60 p-3">
            <label className="text-sm font-medium text-foreground">
              💰 Payment received? Enter the amount to find the order
            </label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₹</span>
              <Input
                className="max-w-[160px]"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 450"
                value={amountReceived}
                onChange={(event) => setAmountReceived(event.target.value)}
              />
              {amountReceived.trim() ? (
                <button
                  type="button"
                  onClick={() => setAmountReceived("")}
                  className="text-xs text-muted-foreground underline"
                >
                  clear
                </button>
              ) : null}
            </div>
            {amountReceived.trim() ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {amountMatchCount === 0
                  ? "No unpaid order of this amount — check the amount, or it may already be marked paid."
                  : `${amountMatchCount} unpaid order${amountMatchCount > 1 ? "s" : ""} of ₹${amountReceived.trim()}. Match the order code with your UPI note, then Mark paid.`}
              </p>
            ) : null}
          </div>

          <Input
            className={searchInputClass}
            placeholder="Search by code, customer, phone or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className={emptyStateClass}>Loading lists…</p>
          ) : !lists.length ? (
            <p className={emptyStateClass}>No {statusTab} orders.</p>
          ) : (
            <div className={listStackClass}>
              {lists.map((list) => (
                <GroceryListCard
                  key={list._id}
                  list={list}
                  draft={getDraft(list)}
                  rate={getRate(list)}
                  draftTotal={getDraftTotal(list)}
                  saving={savingListId === list._id}
                  onPriceChange={(index, value) =>
                    updateDraftPrice(list, index, value)
                  }
                  onRateChange={(index, value) =>
                    updateRate(list, index, value)
                  }
                  onSavePrices={() => void savePrices(list)}
                  onChangeStatus={(status) =>
                    void changeStatus(list._id, status)
                  }
                  onMarkPaid={() => void markPaid(list._id)}
                  onToggleAvailable={(index, available) =>
                    void setItemAvailability(list._id, index, available)
                  }
                  onAddItem={(name, quantity) =>
                    void addItem(list._id, name, quantity)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminGroceryLists;
