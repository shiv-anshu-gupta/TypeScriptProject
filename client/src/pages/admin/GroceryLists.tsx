/**
 * `/admin/grocery-lists` — the screen the shop works from all day.
 *
 * @remarks
 * This is the app's default landing page: `/admin` redirects straight here
 * rather than to the dashboard, because pricing and packing customer lists is
 * the shop's whole job. Everything else in the panel is occasional.
 *
 * The page itself is thin. It renders three controls and a stack of cards, and
 * every piece of state belongs to `useAdminGroceryLists`.
 *
 * @packageDocumentation
 */
import GroceryListCard from "@/components/admin/grocery-lists/grocery-list-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useAdminGroceryLists,
  type StatusTab,
} from "@/features/admin/grocery-lists/use-admin-grocery-lists";
import { cn } from "@/lib/utils";

/**
 * Tailwind class strings, hoisted out of the markup to keep the JSX readable.
 *
 * @remarks
 * Presentation only. They carry no behaviour.
 */
const pageWrapClass = "space-y-6 p-6";
const cardClass = "border-border bg-card shadow-sm";
const cardHeaderClass = "space-y-4";
const cardTitleClass = "text-xl";
const searchInputClass = "max-w-sm";
const emptyStateClass = "py-10 text-center text-sm text-muted-foreground";
const listStackClass = "space-y-4";

/**
 * Lists the shop's orders, with the three tools used to find one.
 *
 * @remarks
 * Layout is a header of controls above a stack of `GroceryListCard`s, one per
 * order. All state, polling and API work lives in `useAdminGroceryLists`; this
 * component only wires its values into the cards.
 *
 * The three controls, in the order they are applied:
 *
 * - **Status tabs** — Active, Completed, Cancelled, each with a count. Active
 *   is the five open statuses together, and it is the default, so completed and
 *   cancelled orders do not clutter the day's work. The counts are of all
 *   orders in that tab, not of what is currently on screen, so a tab can read
 *   6 while one card is shown.
 * - **The amount matcher** — the shopkeeper types the rupee figure they have
 *   just been sent on UPI, and the page narrows to unpaid orders totalling
 *   exactly that. This is how a payment is tied to an order before pressing
 *   Mark paid. The helper text underneath says how many matched; more than one
 *   means the transfer cannot be attributed from the amount alone.
 * - **Search** — by order code, customer name, phone or email.
 *
 * They compose rather than replace one another, which is the usual cause of an
 * unexpectedly empty page: an amount left in the matcher keeps filtering while
 * the shopkeeper searches. The matcher offers a clear link; the tabs and search
 * do not.
 *
 * New orders arrive on their own. The hook polls every 15 seconds and announces
 * anything new with a chime, a flashing tab title and a toast, so the page can
 * be left open on the counter.
 *
 * @returns The grocery-lists screen.
 */
function AdminGroceryLists() {
  const {
    offNetwork,
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
    editItem,
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
            placeholder="Search by code or customer"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </CardHeader>

        <CardContent>
          {offNetwork ? (
            // Staff, away from the shop. Not an error to retry - a rule, and
            // one they can act on.
            <div className="mx-auto max-w-md space-y-2 py-10 text-center">
              <p className="text-base font-medium text-foreground">
                You are not on the shop&apos;s internet connection
              </p>
              <p className="text-sm text-muted-foreground">
                Orders open only on the shop&apos;s own Wi-Fi. Connect to it and
                this page will fill by itself.
              </p>
              <p className="text-sm text-muted-foreground">
                दुकान के Wi-Fi से जुड़िए — फिर यह पन्ना अपने-आप खुल जाएगा।
              </p>
            </div>
          ) : loading ? (
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
                  onEditItem={(index, name, quantity) =>
                    void editItem(list._id, index, name, quantity)
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
