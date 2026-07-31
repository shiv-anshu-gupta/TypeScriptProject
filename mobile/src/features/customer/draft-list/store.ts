import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The ONE place a customer builds their order before sending it to the shop.
// Both the hand-written paper on Home and "Add to list" on catalog products
// write into this same draft, so there is a single list to review and send.
// Persisted to AsyncStorage so a half-written list survives an app restart.

const STORAGE_KEY = "draft_grocery_list_rows";
const INITIAL_ROWS = 20;

export type DraftRow = {
  id: number;
  name: string;
  quantity: string;
};

function makeInitialRows(): DraftRow[] {
  return Array.from({ length: INITIAL_ROWS }, (_, index) => ({
    id: index + 1,
    name: "",
    quantity: "",
  }));
}

function isRowFilled(row: DraftRow) {
  return (row.name ?? "").trim() !== "" || (row.quantity ?? "").trim() !== "";
}

// Keep one trailing blank line so the "paper" grows as items are added.
function withTrailingBlank(rows: DraftRow[], nextId: () => number): DraftRow[] {
  const last = rows[rows.length - 1];
  if (!last || isRowFilled(last)) {
    return [...rows, { id: nextId(), name: "", quantity: "" }];
  }
  return rows;
}

function persist(rows: DraftRow[]) {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows)).catch(() => {});
}

type DraftListStore = {
  rows: DraftRow[];
  hydrated: boolean;
  nextId: number;
  hydrate: () => Promise<void>;
  updateRow: (id: number, key: "name" | "quantity", value: string) => void;
  addProduct: (name: string, unit?: string, unitValue?: number) => void;
  clearDraft: () => void;
  filledCount: () => number;
};

export const useDraftListStore = create<DraftListStore>((set, get) => ({
  rows: makeInitialRows(),
  hydrated: false,
  nextId: INITIAL_ROWS + 1,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as DraftRow[]) : null;
      if (Array.isArray(parsed) && parsed.length) {
        const maxId = parsed.reduce((max, row) => Math.max(max, row.id), 0);
        set({ rows: parsed, nextId: maxId + 1, hydrated: true });
        return;
      }
    } catch {
      // fall through to defaults on any storage/parse error
    }
    set({ hydrated: true });
  },

  updateRow: (id, key, value) => {
    set((state) => {
      let counter = state.nextId;
      const takeId = () => counter++;

      const next = withTrailingBlank(
        state.rows.map((row) =>
          row.id === id ? { ...row, [key]: value } : row,
        ),
        takeId,
      );

      persist(next);
      return { rows: next, nextId: counter };
    });
  },

  // "Add to list" from the catalog. Fills the first empty line (like writing
  // on the next free line of the paper). If the product is already on the
  // list with a plain numeric quantity, bump it instead of adding a twin row.
  addProduct: (name, unit, unitValue) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    set((state) => {
      let counter = state.nextId;
      const takeId = () => counter++;

      const existing = state.rows.find(
        (row) => row.name.trim().toLowerCase() === trimmed.toLowerCase(),
      );

      let rows: DraftRow[];

      if (existing) {
        const match = existing.quantity.trim().match(/^(\d+)(.*)$/);
        const bumped = match
          ? `${Number(match[1]) + 1}${match[2]}`
          : existing.quantity; // free-text like "half kg" — leave untouched
        rows = state.rows.map((row) =>
          row.id === existing.id ? { ...row, quantity: bumped } : row,
        );
      } else {
        // A pack (e.g. a 10 kg bag) starts the quantity at its real pack size
        // "10 kg". Loose items keep "1 kg"; single/piece items keep "1".
        const isPack = typeof unitValue === "number" && unitValue !== 1;
        const defaultQty =
          isPack && unit
            ? `${unitValue} ${unit}`
            : unit && unit !== "piece"
              ? `1 ${unit}`
              : "1";
        const firstBlank = state.rows.find((row) => !isRowFilled(row));

        rows = firstBlank
          ? state.rows.map((row) =>
              row.id === firstBlank.id
                ? { ...row, name: trimmed, quantity: defaultQty }
                : row,
            )
          : [
              ...state.rows,
              { id: takeId(), name: trimmed, quantity: defaultQty },
            ];
      }

      const next = withTrailingBlank(rows, takeId);
      persist(next);
      return { rows: next, nextId: counter };
    });
  },

  clearDraft: () => {
    const rows = makeInitialRows();
    persist(rows);
    set({ rows, nextId: INITIAL_ROWS + 1 });
  },

  filledCount: () => get().rows.filter(isRowFilled).length,
}));
