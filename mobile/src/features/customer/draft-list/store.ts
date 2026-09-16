import { create } from "zustand";
import { stripSpecials } from "@/lib/clean-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

// The ONE place a customer builds their order before sending it to the shop.
// Both the hand-written paper on Home and "Add to list" on catalog products
// write into this same draft, so there is a single list to review and send.
// Persisted to AsyncStorage so a half-written list survives an app restart.

const STORAGE_KEY = "draft_grocery_list_rows";

// Start compact; the list auto-grows a fresh blank line as each one is filled
// (see withTrailingBlank), so there is no upper limit on items.
const INITIAL_ROWS = 8;

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

// A line the customer has started: it holds something worth keeping.
function isRowFilled(row: DraftRow) {
  return (row.name ?? "").trim() !== "" || (row.quantity ?? "").trim() !== "";
}

// A line that will actually be SENT: the shop needs a name. This is the one
// definition behind every "how many items" count in the app - the tab badge,
// the Home card, the sheet header and Send - so they can never disagree.
export function isSendableRow(row: DraftRow) {
  return (row.name ?? "").trim().length > 0;
}

export function countSendableRows(rows: DraftRow[]) {
  return rows.filter(isSendableRow).length;
}

// Keep one trailing blank line so the "paper" grows as items are added.
function withTrailingBlank(rows: DraftRow[], nextId: () => number): DraftRow[] {
  const last = rows[rows.length - 1];
  if (!last || isRowFilled(last)) {
    return [...rows, { id: nextId(), name: "", quantity: "" }];
  }
  return rows;
}

// Saving the draft is a native disk write. Typing a list would do one per
// keystroke, which is exactly the moment the phone should be free, so writes
// are collected and made shortly after typing stops - and immediately when
// the app goes to the background, so nothing is lost.
const PERSIST_DELAY_MS = 500;
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingRows: DraftRow[] | null = null;

function writeNow() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  const rows = pendingRows;
  pendingRows = null;
  if (!rows) return;
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows)).catch(() => {});
}

function persist(rows: DraftRow[]) {
  pendingRows = rows;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(writeNow, PERSIST_DELAY_MS);
}

AppState.addEventListener("change", (state) => {
  if (state !== "active") writeNow();
});

type DraftListStore = {
  rows: DraftRow[];
  hydrated: boolean;
  nextId: number;
  hydrate: () => Promise<void>;
  updateRow: (id: number, key: "name" | "quantity", value: string) => void;
  // Take a line out entirely, so the numbering below it closes up instead of
  // leaving a blank gap where the item was.
  removeRow: (id: number) => void;
  // Top the paper up with blank lines until it has at least `count`, so a tall
  // screen shows a full page of writable lines instead of empty space.
  ensureRows: (count: number) => void;
  addProduct: (name: string, unit?: string, unitValue?: number) => void;
  addProductWithQuantity: (name: string, quantity: string) => void;
  clearDraft: () => void;
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
      // Only restore the saved draft if it still has unsent items in it. If it's
      // all blank — e.g. the last list was already sent, or an old grown list
      // left behind a wall of empty rows — start fresh at the default size
      // instead of carrying over "how many rows I had last time".
      if (Array.isArray(parsed) && parsed.some(isRowFilled)) {
        const maxId = parsed.reduce((max, row) => Math.max(max, row.id), 0);
        set({ rows: parsed, nextId: maxId + 1, hydrated: true });
        return;
      }
    } catch {
      // fall through to defaults on any storage/parse error
    }
    const rows = makeInitialRows();
    persist(rows);
    set({ rows, nextId: INITIAL_ROWS + 1, hydrated: true });
  },

  updateRow: (id, key, value) => {
    const clean = stripSpecials(value);
    set((state) => {
      let counter = state.nextId;
      const takeId = () => counter++;

      const next = withTrailingBlank(
        state.rows.map((row) =>
          row.id === id ? { ...row, [key]: clean } : row,
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

  // Add (or update) a product with an exact quantity chosen in the quantity
  // picker. Unlike addProduct's "+1 bump", this sets the quantity outright.
  addProductWithQuantity: (name, quantity) => {
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
        rows = state.rows.map((row) =>
          row.id === existing.id ? { ...row, quantity } : row,
        );
      } else {
        const firstBlank = state.rows.find((row) => !isRowFilled(row));
        rows = firstBlank
          ? state.rows.map((row) =>
              row.id === firstBlank.id
                ? { ...row, name: trimmed, quantity }
                : row,
            )
          : [...state.rows, { id: takeId(), name: trimmed, quantity }];
      }

      const next = withTrailingBlank(rows, takeId);
      persist(next);
      return { rows: next, nextId: counter };
    });
  },

  removeRow: (id) => {
    set((state) => {
      let counter = state.nextId;
      const takeId = () => counter++;

      // Keep the trailing blank line so there is always somewhere to write.
      const next = withTrailingBlank(
        state.rows.filter((row) => row.id !== id),
        takeId,
      );

      persist(next);
      return { rows: next, nextId: counter };
    });
  },

  ensureRows: (count) => {
    const { rows, nextId } = get();
    if (rows.length >= count) return;

    let counter = nextId;
    const padded = [
      ...rows,
      ...Array.from({ length: count - rows.length }, () => ({
        id: counter++,
        name: "",
        quantity: "",
      })),
    ];
    persist(padded);
    set({ rows: padded, nextId: counter });
  },

  clearDraft: () => {
    const rows = makeInitialRows();
    persist(rows);
    set({ rows, nextId: INITIAL_ROWS + 1 });
  },
}));
