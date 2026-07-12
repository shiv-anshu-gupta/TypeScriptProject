import { useEffect, useMemo, useState } from "react";
import type {
  AdminGroceryList,
  UpdateGroceryListStatusBody,
} from "./types";
import {
  getAdminGroceryLists,
  setAdminGroceryListPrices,
  updateAdminGroceryListStatus,
} from "./api";

// priceDrafts: listId -> array of price strings, one per item line.
type PriceDrafts = Record<string, string[]>;

export function useAdminGroceryLists() {
  const [search, setSearch] = useState("");
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
    const query = search.trim().toLowerCase();

    if (!query) return lists;

    return lists.filter(
      (list) =>
        list.code.toLowerCase().includes(query) ||
        list.customerName.toLowerCase().includes(query) ||
        list.customerEmail.toLowerCase().includes(query),
    );
  }, [lists, search]);

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

  return {
    search,
    setSearch,
    lists: filteredLists,
    loading,
    savingListId,
    refreshAll,
    getDraft,
    updateDraftPrice,
    getDraftTotal,
    savePrices,
    changeStatus,
  };
}
