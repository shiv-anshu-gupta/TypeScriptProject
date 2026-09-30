/**
 * Characterization tests for the draft-list store — the only persisted state
 * in the app, and the logic behind every "how many items" count.
 *
 * @remarks
 * The store is a module-level singleton, so every test starts by resetting it
 * (`clearDraft` + un-hydrating). AsyncStorage is the official jest mock (see
 * the `jest.setupFiles` entry in package.json), so hydration can be exercised
 * by seeding the mock and calling `hydrate()`.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  countSendableRows,
  isSendableRow,
  useDraftListStore,
  type DraftRow,
} from "./store";

const getRows = () => useDraftListStore.getState().rows;
const filledRows = () =>
  getRows().filter((row) => row.name.trim() || row.quantity.trim());

beforeEach(async () => {
  await AsyncStorage.clear();
  useDraftListStore.getState().clearDraft();
  useDraftListStore.setState({ hydrated: false });
});

describe("isSendableRow", () => {
  const row = (name: string, quantity: string): DraftRow => ({
    id: 1,
    name,
    quantity,
  });

  it("counts a row with a name as sendable", () => {
    expect(isSendableRow(row("aata", ""))).toBe(true);
  });

  it("does not count a quantity-only row — the shop needs a name", () => {
    expect(isSendableRow(row("", "2kg"))).toBe(false);
  });

  it("does not count a blank or whitespace-only row", () => {
    expect(isSendableRow(row("", ""))).toBe(false);
    expect(isSendableRow(row("   ", ""))).toBe(false);
  });
});

describe("countSendableRows", () => {
  it("counts only rows with names", () => {
    const rows: DraftRow[] = [
      { id: 1, name: "aata", quantity: "5kg" },
      { id: 2, name: "", quantity: "1" },
      { id: 3, name: "chini", quantity: "" },
      { id: 4, name: "", quantity: "" },
    ];
    expect(countSendableRows(rows)).toBe(2);
  });
});

describe("updateRow", () => {
  it("writes the field and keeps one trailing blank line", () => {
    const last = getRows()[getRows().length - 1];
    useDraftListStore.getState().updateRow(last.id, "name", "aata");

    const rows = getRows();
    // The formerly-last row is filled, and a fresh blank follows it.
    expect(rows[rows.length - 2].name).toBe("aata");
    expect(rows[rows.length - 1].name).toBe("");
  });

  it("strips blocked special characters as the customer types", () => {
    const first = getRows()[0];
    useDraftListStore.getState().updateRow(first.id, "name", "aata<script>@#");
    expect(getRows()[0].name).toBe("aatascript");
  });
});

describe("addProduct", () => {
  it("fills the first blank line instead of growing the list", () => {
    useDraftListStore.getState().addProduct("Aata", "kg", 1);
    expect(getRows()[0]).toMatchObject({ name: "Aata", quantity: "1 kg" });
  });

  it("starts a pack at its real pack size", () => {
    useDraftListStore.getState().addProduct("Rice bag", "kg", 10);
    expect(getRows()[0].quantity).toBe("10 kg");
  });

  it("starts a piece item at plain 1", () => {
    useDraftListStore.getState().addProduct("Soap", "piece", 1);
    expect(getRows()[0].quantity).toBe("1");
  });

  it("bumps a numeric quantity for an existing product (case-insensitive)", () => {
    useDraftListStore.getState().addProduct("Aata", "kg", 1); // "1 kg"
    useDraftListStore.getState().addProduct("aata", "kg", 1);

    expect(filledRows()).toHaveLength(1);
    expect(getRows()[0].quantity).toBe("2 kg");
  });

  it("leaves a free-text quantity like 'half kg' untouched", () => {
    const first = getRows()[0];
    useDraftListStore.getState().updateRow(first.id, "name", "Aata");
    useDraftListStore.getState().updateRow(first.id, "quantity", "half kg");

    useDraftListStore.getState().addProduct("Aata", "kg", 1);
    expect(getRows()[0].quantity).toBe("half kg");
    expect(filledRows()).toHaveLength(1);
  });
});

describe("addProductWithQuantity", () => {
  it("sets the quantity outright instead of bumping", () => {
    useDraftListStore.getState().addProduct("Aata", "kg", 1); // "1 kg"
    useDraftListStore.getState().addProductWithQuantity("Aata", "5 kg");
    expect(getRows()[0].quantity).toBe("5 kg");
    expect(filledRows()).toHaveLength(1);
  });
});

describe("addScannedLines", () => {
  it("writes new lines and returns how many were NEW", () => {
    const written = useDraftListStore.getState().addScannedLines([
      { name: "aata", quantity: "5kg" },
      { name: "chini", quantity: "" },
    ]);
    expect(written).toBe(2);
    expect(filledRows()).toHaveLength(2);
  });

  it("does not duplicate an item already on the list", () => {
    useDraftListStore.getState().addProduct("Aata", "kg", 1);

    const written = useDraftListStore
      .getState()
      .addScannedLines([{ name: "aata", quantity: "" }]);

    expect(written).toBe(0);
    expect(filledRows()).toHaveLength(1);
  });

  it("fills in a missing quantity on an existing line, but never overwrites one", () => {
    const first = getRows()[0];
    useDraftListStore.getState().updateRow(first.id, "name", "aata");

    useDraftListStore
      .getState()
      .addScannedLines([{ name: "Aata", quantity: "5kg" }]);
    expect(getRows()[0].quantity).toBe("5kg");

    useDraftListStore
      .getState()
      .addScannedLines([{ name: "aata", quantity: "9kg" }]);
    expect(getRows()[0].quantity).toBe("5kg");
  });

  it("skips lines whose name strips down to nothing", () => {
    const written = useDraftListStore
      .getState()
      .addScannedLines([{ name: "@#$", quantity: "1" }]);
    expect(written).toBe(0);
    expect(filledRows()).toHaveLength(0);
  });
});

describe("removeRow", () => {
  it("removes the line and keeps a trailing blank to write on", () => {
    useDraftListStore.getState().addProduct("Aata", "kg", 1);
    const target = getRows()[0];

    useDraftListStore.getState().removeRow(target.id);

    expect(filledRows()).toHaveLength(0);
    expect(getRows().length).toBeGreaterThan(0);
    expect(getRows()[getRows().length - 1].name).toBe("");
  });
});

describe("hydrate", () => {
  it("restores a saved draft that still has writing on it", async () => {
    const saved: DraftRow[] = [
      { id: 1, name: "aata", quantity: "5kg" },
      { id: 2, name: "", quantity: "" },
    ];
    await AsyncStorage.setItem(
      "draft_grocery_list_rows",
      JSON.stringify(saved),
    );

    await useDraftListStore.getState().hydrate();

    expect(getRows()).toEqual(saved);
    // nextId continues past the highest saved id.
    expect(useDraftListStore.getState().nextId).toBe(3);
  });

  it("refuses an all-blank saved draft and starts a fresh page", async () => {
    const blank: DraftRow[] = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      name: "",
      quantity: "",
    }));
    await AsyncStorage.setItem(
      "draft_grocery_list_rows",
      JSON.stringify(blank),
    );

    await useDraftListStore.getState().hydrate();

    expect(getRows()).toHaveLength(8);
    expect(filledRows()).toHaveLength(0);
  });

  it("falls back to a fresh page on corrupt storage", async () => {
    await AsyncStorage.setItem("draft_grocery_list_rows", "not json{{{");

    await useDraftListStore.getState().hydrate();

    expect(getRows()).toHaveLength(8);
  });

  it("is a no-op the second time", async () => {
    await useDraftListStore.getState().hydrate();
    useDraftListStore.getState().addProduct("Aata", "kg", 1);

    await useDraftListStore.getState().hydrate();
    expect(getRows()[0].name).toBe("Aata");
  });
});

describe("clearDraft", () => {
  it("returns the paper to a fresh page of blank lines", () => {
    useDraftListStore.getState().addProduct("Aata", "kg", 1);
    useDraftListStore.getState().clearDraft();

    expect(getRows()).toHaveLength(8);
    expect(filledRows()).toHaveLength(0);
  });
});
