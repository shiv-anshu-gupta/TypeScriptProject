import { useEffect, useMemo, useState } from "react";
import type {
  AdminGroceryList,
  UpdateGroceryListStatusBody,
} from "./types";
import {
  getAdminGroceryLists,
  markAdminGroceryListPaid,
  setAdminGroceryListPrices,
  updateAdminGroceryListStatus,
} from "./api";

// priceDrafts: listId -> array of price strings, one per item line.
type PriceDrafts = Record<string, string[]>;

export function useAdminGroceryLists() {
  const [search, setSearch] = useState("");
  // "Money received" matcher: the shopkeeper types the amount they got on UPI
  // and instantly sees the still-unpaid orders of exactly that amount.
  const [amountReceived, setAmountReceived] = useState("");
  const [lists, setLists] = useState<AdminGroceryList[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingListId, setSavingListId] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<PriceDrafts>({});

  async function refreshAll() {
    try {
      setLoading(true);

      const response = await getAdminGroceryLists();
      setLists((response ?? { items: [] }).items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const filteredLists = useMemo(() => {
    let result = lists;

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
          list.customerEmail.toLowerCase().includes(query) ||
          (list.customerPhone ?? "").includes(query),
      );
    }

    return result;
  }, [lists, search, amountReceived]);

  // How many unpaid orders match the entered amount (drives the helper text).
  const amountMatchCount = useMemo(() => {
    const amount = Number(amountReceived.trim());
    if (!amountReceived.trim() || Number.isNaN(amount) || amount <= 0) return 0;
    return lists.filter(
      (list) =>
        list.paymentStatus !== "paid" &&
        Math.round(list.totalAmount) === Math.round(amount),
    ).length;
  }, [lists, amountReceived]);

  // Seed the draft prices from whatever the list already has.
  function getDraft(list: AdminGroceryList) {
    return (
      priceDrafts[list._id] ??
      list.items.map((item) => (item.price ? String(item.price) : ""))
    );
  }

  function updateDraftPrice(
    list: AdminGroceryList,
    index: number,
    value: string,
  ) {
    const current = getDraft(list);
    const next = current.map((item, i) => (i === index ? value : item));

    setPriceDrafts((prev) => ({ ...prev, [list._id]: next }));
  }

  function getDraftTotal(list: AdminGroceryList) {
    return getDraft(list).reduce((sum, value) => {
      const price = Number(value);
      return sum + (Number.isNaN(price) ? 0 : price);
    }, 0);
  }

  async function savePrices(list: AdminGroceryList) {
    const draft = getDraft(list);

    try {
      setSavingListId(list._id);

      const response = await setAdminGroceryListPrices(list._id, {
        items: draft.map((value) => ({ price: Number(value) || 0 })),
      });

      setLists((response ?? { items: [] }).items);
      setPriceDrafts((prev) => {
        const next = { ...prev };
        delete next[list._id];
        return next;
      });
    } finally {
      setSavingListId("");
    }
  }

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

  async function markPaid(listId: string) {
    try {
      setSavingListId(listId);

      const response = await markAdminGroceryListPaid(listId);
      setLists((response ?? { items: [] }).items);
    } finally {
      setSavingListId("");
    }
  }

  return {
    search,
    setSearch,
    amountReceived,
    setAmountReceived,
    amountMatchCount,
    lists: filteredLists,
    loading,
    savingListId,
    refreshAll,
    getDraft,
    updateDraftPrice,
    getDraftTotal,
    savePrices,
    changeStatus,
    markPaid,
  };
}
