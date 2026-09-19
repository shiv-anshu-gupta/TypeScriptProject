/**
 * The unsent grocery list — the piece of paper the whole app writes on.
 *
 * @remarks
 * This is the only state in the app that survives being killed, and the only
 * store that writes to AsyncStorage. Everything else is fetched again at
 * launch.
 *
 * @packageDocumentation
 */

import { create } from "zustand";
import { stripSpecials } from "@/lib/clean-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

// The ONE place a customer builds their order before sending it to the shop.
// Both the hand-written paper on Home and "Add to list" on catalog products
// write into this same draft, so there is a single list to review and send.
// Persisted to AsyncStorage so a half-written list survives an app restart.

/**
 * AsyncStorage key the rows are saved under.
 *
 * @remarks
 * Holds the `DraftRow[]` as JSON and nothing else — no ids, no timestamps —
 * so anything unrecognised there is simply ignored on hydration. Changing
 * this key silently discards every customer's unsent list on upgrade.
 */
const STORAGE_KEY = "draft_grocery_list_rows";

// Start compact; the list auto-grows a fresh blank line as each one is filled
// (see withTrailingBlank), so there is no upper limit on items.
const INITIAL_ROWS = 8;

/**
 * One line on the paper.
 *
 * @remarks
 * `id` is stable for the life of a line and is what the editor keys on, so a
 * line keeps its keyboard focus while the list grows around it. It is not a
 * position: removing a line leaves a gap in the ids, and the number the
 * customer sees is the index, not this.
 *
 * `name` and `quantity` are free text and may both be empty — that is a blank
 * line, not an invalid one. `quantity` is never parsed as a number except by
 * `addProduct`'s "+1" bump.
 */
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

/**
 * A line that will actually be SENT: the shop needs a name. This is the one
 * definition behind every "how many items" count in the app - the tab badge,
 * the Home card, the sheet header and Send - so they can never disagree.
 *
 * @remarks
 * A quantity with no name is not sendable, which is why it is possible to see
 * a line with writing on it that the badge does not count.
 *
 * It says nothing about whether the line is *acceptable*: the send flow also
 * requires at least two characters, mirroring the server. Do not use this as
 * the last check before a POST.
 */
export function isSendableRow(row: DraftRow) {
  return (row.name ?? "").trim().length > 0;
}

/**
 * How many items the customer has written, by the one definition above.
 *
 * @remarks
 * Every count the customer sees comes from here — the tab badge, the centre
 * button, the Shop sticky bar, the sheet header. Compute a count any other
 * way and two places will eventually disagree.
 */
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

/**
 * How long writing has to stop before the draft is saved, in milliseconds.
 *
 * @remarks
 * Saving the draft is a native disk write. Typing a list would do one per
 * keystroke, which is exactly the moment the phone should be free, so writes
 * are collected and made shortly after typing stops - and immediately when
 * the app goes to the background, so nothing is lost.
 *
 * The consequence to know: for up to half a second after a keystroke, what is
 * on disk is older than what is in the store. Only two things close that gap
 * — the timer, and the `AppState` listener below. A test or a caller that
 * wants the disk to be current must go through one of them; there is no
 * exported flush.
 */
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

/**
 * One line read off a photo of the customer's handwritten list.
 *
 * @remarks
 * A suggestion, not a fact. It becomes an ordinary editable line, because the
 * reader can misread a word and a wrong line means a wrong bill.
 *
 * `quantity` is often empty — a handwritten list frequently names an item and
 * nothing else.
 */
export type ScannedLine = {
  name: string;
  quantity: string;
};

/**
 * How many photos may be read in one go (kept in step with the server).
 *
 * @remarks
 * The server enforces the same ceiling, so raising it here alone makes the
 * upload fail rather than read more pages.
 */
export const MAX_PHOTOS_PER_SCAN = 3;

type DraftListStore = {
  rows: DraftRow[];
  hydrated: boolean;
  nextId: number;
  /**
   * Reads the saved list back from disk. Call once, at startup.
   *
   * @remarks
   * Does nothing on a second call, so it is safe in an effect. Resolves
   * whatever happens, including a storage or parse failure, which falls back
   * to a fresh page of blank lines.
   */
  hydrate: () => Promise<void>;
  /**
   * Writes one field of one line, as the customer types.
   *
   * @remarks
   * Every keystroke goes through here, and through `stripSpecials` on the way
   * — a blocked character never reaches the row. Filling the last line
   * appends a new blank one, so the row list can change between a keypress
   * and its handler; handlers should read the current rows rather than the
   * ones their render closed over.
   */
  updateRow: (id: number, key: "name" | "quantity", value: string) => void;
  /**
   * Take a line out entirely, so the numbering below it closes up instead of
   * leaving a blank gap where the item was.
   */
  removeRow: (id: number) => void;
  /**
   * Top the paper up with blank lines until it has at least `count`, so a tall
   * screen shows a full page of writable lines instead of empty space.
   *
   * @remarks
   * Never removes lines, so it is safe to call on every layout change. The
   * list sheet measures its own viewport and calls it with the number of rows
   * that fit.
   */
  ensureRows: (count: number) => void;
  /**
   * Adds a catalogue product to the list, or bumps it if it is already there.
   *
   * @remarks
   * What the "+" on a product card does. Matching is by name, case-insensitive
   * and trimmed. An existing line whose quantity starts with an integer is
   * incremented; free text like "half kg" is left exactly as written, because
   * the customer meant it. A new line takes the first blank one, so the list
   * fills like a page rather than growing at the bottom.
   *
   * `unitValue` decides the starting quantity: a real pack size gives
   * "10 kg", a loose unit gives "1 kg", anything else gives "1".
   */
  addProduct: (name: string, unit?: string, unitValue?: number) => void;
  /**
   * Adds a product with an exact quantity, replacing any quantity already
   * there.
   *
   * @remarks
   * What the quantity picker and the details screen use. Unlike
   * {@link DraftListStore.addProduct} this **sets** rather than bumps: the
   * customer has just said how much they want, so asking again must not add
   * to the old answer.
   */
  addProductWithQuantity: (name: string, quantity: string) => void;
  /**
   * Write what a photo of the handwritten list was read as onto the paper,
   * in ordinary editable lines. Returns how many lines it wrote.
   *
   * @remarks
   * An item already on the list is not duplicated: its quantity is filled in
   * if it had none, and otherwise it is left alone. The return count is of
   * **new** lines, so it can be lower than the number of lines read — which
   * is what the "N items added" toast should say.
   */
  addScannedLines: (lines: ScannedLine[]) => number;
  /**
   * Empties the paper back to a fresh page of blank lines.
   *
   * @remarks
   * Called by the send flow once the list has actually reached the shop, and
   * by nothing else. It is not undoable and there is no copy kept — the sent
   * list now lives on the server.
   */
  clearDraft: () => void;
};

/**
 * Holds the unsent list: the rows, whether they have been read back from
 * disk, and the counter that hands out row ids.
 *
 * @remarks
 * Written from everywhere a customer can add to their list — the paper editor,
 * "add to list" on a product card, the quantity picker, the photo scan — and
 * cleared by the send flow once the list is on its way.
 *
 * **Persisted.** The rows go to AsyncStorage under `draft_grocery_list_rows`,
 * debounced by half a second, and immediately whenever the app leaves the
 * foreground. `hydrated` and `nextId` are **not** persisted: `hydrated` is
 * about this process, and `nextId` is recomputed from the saved rows.
 *
 * **Hydration** happens once, from the app root, and is deliberately not
 * gated on being signed in — a list written before signing in is still the
 * customer's list. It is also picky: saved rows are restored only if at least
 * one of them has writing on it, so an already-sent list or an old grown one
 * cannot carry a wall of blank lines into the new session. Until `hydrate()`
 * resolves the store holds eight blank rows, which is what the editor shows.
 *
 * **The invariant behind every count** is `isSendableRow`: a row with a
 * non-empty name. The tab badge, the centre button, the Shop sticky bar, the
 * sheet header and Send all count with it, so they cannot disagree.
 *
 * **The paper always ends in one blank line.** Every mutation runs the rows
 * through `withTrailingBlank`, so there is somewhere to write and no item
 * limit.
 *
 * Nothing here talks to the network. Sending belongs to `useSendDraft`.
 */
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

  // What a photo was read as goes onto the paper exactly like typed lines -
  // same rows, same editing - because the reader can misread a word and the
  // customer must be able to fix it before the list is sent. Nothing about
  // the photo is kept once this has run.
  addScannedLines: (lines) => {
    let written = 0;

    set((state) => {
      let counter = state.nextId;
      const takeId = () => counter++;
      let rows = state.rows;

      for (const line of lines) {
        const name = stripSpecials(line.name).trim();
        if (!name) continue;
        const quantity = stripSpecials(line.quantity ?? "").trim();

        // The same item written twice (on the paper, or already typed) should
        // not become two lines - fill in the quantity instead.
        const existing = rows.find(
          (row) => row.name.trim().toLowerCase() === name.toLowerCase(),
        );
        if (existing) {
          if (quantity && !existing.quantity.trim()) {
            rows = rows.map((row) =>
              row.id === existing.id ? { ...row, quantity } : row,
            );
          }
          continue;
        }

        const firstBlank = rows.find((row) => !isRowFilled(row));
        rows = firstBlank
          ? rows.map((row) =>
              row.id === firstBlank.id ? { ...row, name, quantity } : row,
            )
          : [...rows, { id: takeId(), name, quantity }];
        written += 1;
      }

      const next = withTrailingBlank(rows, takeId);
      persist(next);
      return { rows: next, nextId: counter };
    });

    return written;
  },

  clearDraft: () => {
    const rows = makeInitialRows();
    persist(rows);
    set({ rows, nextId: INITIAL_ROWS + 1 });
  },
}));
