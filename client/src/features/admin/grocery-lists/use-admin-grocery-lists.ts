/**
 * The state behind `/admin/grocery-lists`, the screen the shop uses all day.
 *
 * @remarks
 * One hook owns the whole page: the polled list of orders, the three filters,
 * the pricing drafts, and every mutation. The page and the cards hold almost no
 * state of their own.
 *
 * Three behaviours are worth understanding before changing anything here.
 *
 * **It polls every 15 seconds.** A background poll is silent: it does not touch
 * the loading flag, so the page never flickers. The poll is also how a new
 * customer order is noticed at all — there is no socket and no server-sent
 * stream.
 *
 * **Prices are drafts until saved.** What the shopkeeper types lives only in
 * this hook, keyed by list id, and is never sent until the save button is
 * pressed. The draft getters prefer a draft over the server's value, which is
 * precisely what stops the 15-second poll from wiping out half-typed prices.
 * Drafts are in memory only: a page reload loses them silently.
 *
 * **Nothing is optimistic.** Every mutation awaits the server and replaces the
 * whole array with what comes back. The screen therefore lags a keystroke
 * behind the truth, but it can never show a change the server refused.
 *
 * @packageDocumentation
 */
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * The marker the server puts at the front of its off-network refusal.
 *
 * Matched instead of the prose that follows it, so rewording or translating
 * the message cannot quietly break this check.
 */
const OFF_NETWORK_CODE = "OFF_SHOP_NETWORK";
import type {
  AdminGroceryList,
  GroceryListStatus,
  UpdateGroceryListStatusBody,
} from "./types";
import {
  addAdminGroceryListItem,
  getAdminGroceryLists,
  markAdminGroceryListPaid,
  setAdminGroceryListItemAvailability,
  setAdminGroceryListPrices,
  updateAdminGroceryListItem,
  updateAdminGroceryListStatus,
} from "./api";
import { notifyNewOrders } from "@/lib/order-alert";

// How often to check for new customer lists while the page is open.
/**
 * Poll interval for the list of orders, in milliseconds.
 *
 * @remarks
 * Fifteen seconds. This is the shop's only automatic route to a new order while
 * the page is open, so shortening it multiplies requests and lengthening it
 * delays the new-order chime. The chat inside each card polls separately and
 * faster.
 */
const POLL_MS = 15000;

// Status tabs so cancelled / completed orders don't clutter the active ones.
/**
 * The three tabs at the top of the page.
 *
 * @remarks
 * "Active" is not a status — it is the group of five open ones. See
 * {@link STATUS_GROUPS}.
 */
export type StatusTab = "active" | "completed" | "cancelled";

/**
 * Which statuses each tab shows.
 *
 * @remarks
 * Every status belongs to exactly one tab, so the three tab counts add up to
 * the total. A new status would have to be added here or it would vanish from
 * all three views.
 */
const STATUS_GROUPS: Record<StatusTab, GroceryListStatus[]> = {
  active: ["received", "priced", "packing", "packed", "ready"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

// priceDrafts: listId -> array of price strings, one per item line.
/**
 * Unsaved input values, keyed by list id, one string per item line.
 *
 * @remarks
 * Used for both the price and the rate columns. The values stay as strings
 * rather than numbers so a partly typed entry survives — an empty box, a lone
 * decimal point — and the array is positional, so it is only valid while the
 * list has the same number of items.
 *
 * A list with no entry here has never been typed into, and its inputs are
 * seeded from the server's values instead.
 */
type PriceDrafts = Record<string, string[]>;

/**
 * Loads, filters, prices and advances the shop's grocery lists.
 *
 * @remarks
 * Mounted once by the grocery-lists page. The card components are presentation
 * over the values this returns.
 *
 * What it owns:
 *
 * - **The orders**, refreshed on mount and then every
 *   {@link POLL_MS} milliseconds. A failed poll leaves the previous list on
 *   screen; no error is surfaced, so a server outage looks like a quiet shop.
 * - **Three filters**, applied in order: the status tab, then the amount
 *   matcher, then the text search. They compose, so a search can return nothing
 *   because an amount is still in the matcher box.
 * - **Price and rate drafts**, in memory only.
 * - **`savingListId`**, which the card uses to disable a list's controls while
 *   one of its mutations is in flight.
 *
 * New-order alerting works off a ref holding the ids seen so far. The first
 * poll only seeds that set, so opening the page does not announce every order
 * already in it; from the second poll onwards, an unrecognised id triggers the
 * chime, the tab-title flash and a toast. Because the set lives in a ref, a
 * reload re-seeds and nothing is announced twice.
 *
 * Mutations all follow one shape: set `savingListId`, await the call, replace
 * the whole array from the response, clear `savingListId`. None of them catches
 * its error — a rejection propagates to the caller, and the card is responsible
 * for the toast.
 *
 * @returns The filtered lists, the filter state and setters, the tab counts,
 * the draft accessors, and every mutation the card needs.
 */
export function useAdminGroceryLists() {
  const [search, setSearch] = useState("");
  // "Money received" matcher: the shopkeeper types the amount they got on UPI
  // and instantly sees the still-unpaid orders of exactly that amount.
  const [amountReceived, setAmountReceived] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("active");
  const [lists, setLists] = useState<AdminGroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  /** True while the shop's server is refusing because we are off its network. */
  const [offNetwork, setOffNetwork] = useState(false);
  const [savingListId, setSavingListId] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<PriceDrafts>({});
  // Optional per-unit rate the shopkeeper types; auto-fills the line price.
  const [rateDrafts, setRateDrafts] = useState<PriceDrafts>({});

  // Track which list IDs we've already seen so a background poll can detect a
  // genuinely new customer list and alert (sound + toast + tab-title flash).
  const knownIds = useRef<Set<string>>(new Set());
  const seededOnce = useRef(false);

  /**
   * Refetches every list, and announces any that are new.
   *
   * @remarks
   * Called once on mount, on the 15-second timer, and by the page's manual
   * refresh. The first poll only seeds the set of known ids, so opening the
   * page never announces the orders already in it.
   *
   * If the request fails, the rejection propagates and the previous lists stay
   * on screen. Nothing is shown to the shopkeeper, so a server that has been
   * down for an hour looks the same as an hour with no new orders.
   *
   * Note that this replaces the whole array, and so discards nothing else: the
   * pricing drafts are held separately and are unaffected, which is what lets
   * the poll run while prices are being typed.
   *
   * @param silent - `true` for a background poll, which leaves the loading flag
   * alone so the page does not flicker. Pass `false` only when the shopkeeper
   * asked for the refresh and should see it happen.
   */
  // silent = background poll (don't flip the loading spinner / don't flicker).
  async function refreshAll(silent = false) {
    try {
      if (!silent) setLoading(true);

      const response = await getAdminGroceryLists();
      setOffNetwork(false);
      const items = (response ?? { items: [] }).items;

      if (seededOnce.current) {
        const fresh = items.filter((list) => !knownIds.current.has(list._id));
        if (fresh.length) {
          notifyNewOrders(fresh.length, fresh[0]?.customerName);
        }
      }
      knownIds.current = new Set(items.map((list) => list._id));
      seededOnce.current = true;

      setLists(items);
    } catch (error) {
      // The one failure worth telling apart from "the server is unhappy": a
      // staff member away from the shop. The page shows them what to do about
      // it instead of an error that repeats every fifteen seconds.
      if (error instanceof Error && error.message.includes(OFF_NETWORK_CODE)) {
        setOffNetwork(true);
        setLists([]);
        return;
      }
      throw error;
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
    // Keep the page live: check for new lists every POLL_MS while it's open.
    const timer = window.setInterval(() => void refreshAll(true), POLL_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * The orders actually shown, after all three filters.
   *
   * @remarks
   * Applied in order: status tab, then the amount matcher, then the text
   * search. They compose rather than replace one another, so an empty screen
   * may be caused by a filter the shopkeeper has forgotten about — most often a
   * figure left in the amount box.
   *
   * The amount matcher compares rounded rupees and only ever shows **unpaid**
   * orders, since its job is to identify which order a UPI transfer belongs to.
   * The search covers order code, customer name, email and phone; all but the
   * phone are matched case-insensitively.
   */
  const filteredLists = useMemo(() => {
    // Status tab first — keep cancelled / completed out of the active view.
    let result = lists.filter((list) =>
      STATUS_GROUPS[statusTab].includes(list.status),
    );

    // Money-received matcher takes priority: narrow to UNPAID orders whose
    // total equals the amount the shopkeeper just received.
    const amount = Number(amountReceived.trim());
    if (amountReceived.trim() && !Number.isNaN(amount) && amount > 0) {
      result = result.filter(
        (list) =>
          list.paymentStatus !== "paid" &&
          Math.round(list.totalAmount) === Math.round(amount),
      );
    }

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (list) =>
          list.code.toLowerCase().includes(query) ||
          list.customerName.toLowerCase().includes(query) ||
          // Both are absent for a staff member - the server does not send a
          // customer's contact details to them - so neither may be assumed.
          (list.customerEmail ?? "").toLowerCase().includes(query) ||
          (list.customerPhone ?? "").includes(query),
      );
    }

    return result;
  }, [lists, search, amountReceived, statusTab]);

  // Counts per tab, so each tab shows how many orders it holds.
  /**
   * How many orders sit in each tab.
   *
   * @remarks
   * Counted from the unfiltered list, so the badges keep showing the true
   * totals while a search or an amount is narrowing the view. A tab may
   * therefore read 6 while the page below shows one card.
   */
  const statusCounts = useMemo(
    () => ({
      active: lists.filter((l) => STATUS_GROUPS.active.includes(l.status))
        .length,
      completed: lists.filter((l) => STATUS_GROUPS.completed.includes(l.status))
        .length,
      cancelled: lists.filter((l) => STATUS_GROUPS.cancelled.includes(l.status))
        .length,
    }),
    [lists],
  );

  // How many unpaid orders match the entered amount (drives the helper text).
  /**
   * How many unpaid orders total exactly the amount typed in the matcher.
   *
   * @remarks
   * Drives the helper text under the amount box, and it counts across **all**
   * tabs rather than only the current one. So a count of 1 alongside an empty
   * page usually means the matching order is completed or cancelled and the
   * Active tab is hiding it.
   *
   * A count above 1 is the case that matters: two unpaid orders for the same
   * amount cannot be told apart by the transfer alone, and the shopkeeper has
   * to check with the customer before marking either one paid.
   */
  const amountMatchCount = useMemo(() => {
    const amount = Number(amountReceived.trim());
    if (!amountReceived.trim() || Number.isNaN(amount) || amount <= 0) return 0;
    return lists.filter(
      (list) =>
        list.paymentStatus !== "paid" &&
        Math.round(list.totalAmount) === Math.round(amount),
    ).length;
  }, [lists, amountReceived]);

  /**
   * The price strings for a list's rows.
   *
   * @remarks
   * Returns the draft if this list has been typed into, otherwise seeds from
   * the server's saved prices, with a zero price shown as an empty box rather
   * than "0".
   *
   * Preferring the draft is the whole reason the 15-second poll is safe: a
   * refresh landing mid-typing replaces the orders but not what is in the
   * inputs.
   *
   * @param list - The order being priced.
   * @returns One string per item, in item order.
   */
  // Seed the draft prices from whatever the list already has.
  function getDraft(list: AdminGroceryList) {
    return (
      priceDrafts[list._id] ??
      list.items.map((item) => (item.price ? String(item.price) : ""))
    );
  }

  /**
   * Records a typed line price.
   *
   * @remarks
   * Writes to the draft only. Nothing reaches the server until
   * {@link savePrices} is called, and an unsaved draft is lost on reload.
   *
   * @param list - The order being priced.
   * @param index - Which row.
   * @param value - The raw input text, kept as typed.
   */
  function updateDraftPrice(
    list: AdminGroceryList,
    index: number,
    value: string,
  ) {
    const current = getDraft(list);
    const next = current.map((item, i) => (i === index ? value : item));

    setPriceDrafts((prev) => ({ ...prev, [list._id]: next }));
  }

  /**
   * The per-unit rate strings for a list's rows.
   *
   * @remarks
   * The rate column's counterpart to {@link getDraft}, seeded the same way from
   * the server's saved rates.
   *
   * @param list - The order being priced.
   * @returns One string per item, in item order.
   */
  // Seed the rate drafts from whatever the list already has.
  function getRate(list: AdminGroceryList) {
    return (
      rateDrafts[list._id] ??
      list.items.map((item) => (item.rate ? String(item.rate) : ""))
    );
  }

  /**
   * Records a typed rate and fills in the line price from it.
   *
   * @remarks
   * The shop's usual way of pricing: type what a unit costs and let the line
   * total follow. The quantity is the customer's free text, so only a leading
   * number is read from it; text with no leading number - "half dozen", "1
   * packet" - is treated as a quantity of 1 rather than rejected. The product
   * is rounded to whole rupees.
   *
   * It overwrites whatever was in the price box, including a figure typed by
   * hand, so touching the rate after adjusting a price discards that
   * adjustment. A rate that is blank, zero or not a number clears the price
   * rather than writing 0.
   *
   * @param list - The order being priced.
   * @param index - Which row.
   * @param value - The raw rate text.
   */
  // Typing a per-unit rate auto-fills the line price = rate × quantity number
  // (parsed from the free-text quantity; falls back to ×1 if it has no number).
  function updateRate(list: AdminGroceryList, index: number, value: string) {
    const current = getRate(list);
    const next = current.map((item, i) => (i === index ? value : item));
    setRateDrafts((prev) => ({ ...prev, [list._id]: next }));

    const qtyNum = parseFloat(list.items[index]?.quantity ?? "");
    const qty = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 1;
    const rate = Number(value);
    const computed =
      Number.isFinite(rate) && rate > 0 ? String(Math.round(rate * qty)) : "";
    updateDraftPrice(list, index, computed);
  }

  /**
   * Sums the current price drafts for a list.
   *
   * @remarks
   * What the card shows as the running total while the shopkeeper types, in
   * place of the server's `totalAmount`. The two differ until prices are saved.
   *
   * Non-numeric entries count as zero, so a typo in one row quietly lowers the
   * total instead of showing an error.
   *
   * @param list - The order being priced.
   * @returns The total in rupees.
   */
  function getDraftTotal(list: AdminGroceryList) {
    return getDraft(list).reduce((sum, value) => {
      const price = Number(value);
      return sum + (Number.isNaN(price) ? 0 : price);
    }, 0);
  }

  /**
   * Sends the drafted prices to the server and notifies the customer.
   *
   * @remarks
   * The page's main action, behind "Send prices to customer" and, once priced,
   * "Update prices".
   *
   * Every row is sent, not only the edited ones, because the endpoint takes the
   * list positionally. A row whose rate was never filled in is sent as rate 0
   * rather than omitted, so an untouched rate is stored as zero even though the
   * field is optional in the type.
   *
   * On success both draft maps for this list are dropped, so the inputs re-seed
   * from the server's authoritative values.
   *
   * Two effects on the server to keep in mind: the customer receives a push
   * with the total, and the status is hard-set to `priced`. Calling this on a
   * list that has already reached `packed` or `ready` therefore drags it
   * backwards and notifies the customer a second time.
   *
   * @param list - The order to price.
   * @throws The server's error message; the drafts are then left untouched so
   * the shopkeeper can retry.
   */
  async function savePrices(list: AdminGroceryList) {
    const draft = getDraft(list);
    const rate = getRate(list);

    try {
      setSavingListId(list._id);

      const response = await setAdminGroceryListPrices(list._id, {
        items: draft.map((value, i) => ({
          price: Number(value) || 0,
          rate: Number(rate[i]) || 0,
        })),
      });

      setLists((response ?? { items: [] }).items);
      setPriceDrafts((prev) => {
        const next = { ...prev };
        delete next[list._id];
        return next;
      });
      setRateDrafts((prev) => {
        const next = { ...prev };
        delete next[list._id];
        return next;
      });
    } finally {
      setSavingListId("");
    }
  }

  /**
   * Adds an item the customer asked for after sending the list.
   *
   * @remarks
   * A blank name is ignored silently rather than reported.
   *
   * Because this changes the item count, both draft maps for the list are
   * discarded afterwards - a positional draft array would otherwise be
   * misaligned with the rows. Any price typed and not yet saved is lost, so
   * save prices before adding an item.
   *
   * @param listId - The list's `_id`.
   * @param name - Item name. Trimmed here; already stripped against the
   * Unicode allowlist by the card.
   * @param quantity - Free-text quantity.
   * @throws The server's error message.
   */
  async function addItem(listId: string, name: string, quantity: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      setSavingListId(listId);
      const response = await addAdminGroceryListItem(listId, {
        name: trimmed,
        quantity: quantity.trim(),
      });
      setLists((response ?? { items: [] }).items);
      // drop stale drafts so the new item's inputs seed fresh
      setPriceDrafts((prev) => {
        const next = { ...prev };
        delete next[listId];
        return next;
      });
      setRateDrafts((prev) => {
        const next = { ...prev };
        delete next[listId];
        return next;
      });
    } finally {
      setSavingListId("");
    }
  }

  /**
   * Corrects an existing item's name or quantity.
   *
   * @remarks
   * Unlike {@link addItem}, the drafts are deliberately kept: the item count is
   * unchanged, so the positional arrays still line up and a half-typed price
   * survives the correction.
   *
   * A blank name is ignored silently.
   *
   * @param listId - The list's `_id`.
   * @param index - Which row.
   * @param name - Replacement name.
   * @param quantity - Replacement free-text quantity.
   * @throws The server's error message.
   */
  // Edit an existing item's name / quantity (price drafts kept — same count).
  async function editItem(
    listId: string,
    index: number,
    name: string,
    quantity: string,
  ) {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      setSavingListId(listId);
      const response = await updateAdminGroceryListItem(listId, index, {
        name: trimmed,
        quantity: quantity.trim(),
      });
      setLists((response ?? { items: [] }).items);
    } finally {
      setSavingListId("");
    }
  }

  /**
   * Moves an order one step along the flow, or cancels it.
   *
   * @remarks
   * The card offers only the immediate next step, so this is not a general
   * "set status" - see {@link GroceryListStatus} for why the flow is one-way.
   * Each step sends the customer a push.
   *
   * @param listId - The list's `_id`.
   * @param status - The next status, or `cancelled`.
   * @throws The server's error message.
   */
  async function changeStatus(
    listId: string,
    status: UpdateGroceryListStatusBody["status"],
  ) {
    try {
      setSavingListId(listId);

      const response = await updateAdminGroceryListStatus(listId, { status });
      setLists((response ?? { items: [] }).items);
    } finally {
      setSavingListId("");
    }
  }

  /**
   * Marks an order's payment as received.
   *
   * @remarks
   * Payment is tracked separately from the packing flow, so this does not move
   * the order along. There is no way to undo it from this panel.
   *
   * @param listId - The list's `_id`.
   * @throws The server's error message.
   */
  async function markPaid(listId: string) {
    try {
      setSavingListId(listId);

      const response = await markAdminGroceryListPaid(listId);
      setLists((response ?? { items: [] }).items);
    } finally {
      setSavingListId("");
    }
  }

  /**
   * Marks one line out of stock, or restores it.
   *
   * @remarks
   * Unlike prices, this applies immediately - there is no draft and no save
   * step, so a mis-tap is visible to the customer at once.
   *
   * Marking unavailable forces the line's price to 0 on the server and pushes
   * the customer. Restoring sends no push and does not bring the old price
   * back.
   *
   * @param listId - The list's `_id`.
   * @param index - Which row.
   * @param available - `false` to mark out of stock.
   * @throws The server's error message.
   */
  async function setItemAvailability(
    listId: string,
    index: number,
    available: boolean,
  ) {
    try {
      setSavingListId(listId);

      const response = await setAdminGroceryListItemAvailability(
        listId,
        index,
        available,
      );
      setLists((response ?? { items: [] }).items);
    } finally {
      setSavingListId("");
    }
  }

  return {
    offNetwork,
    search,
    setSearch,
    amountReceived,
    setAmountReceived,
    amountMatchCount,
    statusTab,
    setStatusTab,
    statusCounts,
    lists: filteredLists,
    loading,
    savingListId,
    refreshAll,
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
  };
}
