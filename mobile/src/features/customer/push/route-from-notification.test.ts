/**
 * Where a tapped notification leads, for every payload the server sends and
 * for the junk a newer (or broken) server might.
 *
 * @packageDocumentation
 */
import {
  isOrderNotification,
  routeFromNotification,
} from "./route-from-notification";

describe("routeFromNotification", () => {
  describe("broadcasts", () => {
    it.each([
      [{ type: "broadcast", target: "home" }, { kind: "home" }],
      [{ type: "broadcast", target: "products" }, { kind: "shop" }],
      [{ type: "broadcast", target: "writeList" }, { kind: "writeList" }],
      [
        { type: "broadcast", target: "category", targetId: "cat1" },
        { kind: "category", categoryId: "cat1" },
      ],
      [
        { type: "broadcast", target: "product", targetId: "p1" },
        { kind: "product", productId: "p1" },
      ],
    ])("%j", (data, expected) => {
      expect(routeFromNotification(data)).toEqual(expected);
    });

    it.each([
      [{ type: "broadcast", target: "category" }],
      [{ type: "broadcast", target: "category", targetId: "" }],
      [{ type: "broadcast", target: "category", targetId: "  " }],
      [{ type: "broadcast", target: "product" }],
      [{ type: "broadcast", target: "product", targetId: 42 }],
    ])("goes nowhere without a target id: %j", (data) => {
      expect(routeFromNotification(data)).toBeNull();
    });

    it("ignores a target this build does not know", () => {
      expect(
        routeFromNotification({ type: "broadcast", target: "rewards" }),
      ).toBeNull();
      expect(routeFromNotification({ type: "broadcast" })).toBeNull();
    });

    it("ignores a targetId on targets that do not need one", () => {
      expect(
        routeFromNotification({
          type: "broadcast",
          target: "home",
          targetId: "x",
        }),
      ).toEqual({ kind: "home" });
    });

    it("is a broadcast even if it happens to carry a listId", () => {
      expect(
        routeFromNotification({
          type: "broadcast",
          target: "products",
          listId: "l1",
        }),
      ).toEqual({ kind: "shop" });
    });
  });

  describe("order updates", () => {
    it.each([
      [{ listId: "l1" }],
      [{ listId: "l1", type: "new_message" }],
      [{ listId: "l1", type: "item_unavailable" }],
      [{ listId: "l1", type: "item_added" }],
    ])("open Lists: %j", (data) => {
      expect(routeFromNotification(data)).toEqual({ kind: "lists" });
    });
  });

  describe("junk", () => {
    it.each([
      [null],
      [undefined],
      ["broadcast"],
      [42],
      [[]],
      [{}],
      [{ listId: "" }],
      [{ listId: 7 }],
      [{ type: "something_else" }],
    ])("goes nowhere: %j", (data) => {
      expect(routeFromNotification(data)).toBeNull();
    });
  });
});

describe("isOrderNotification", () => {
  it("is true for anything carrying a listId", () => {
    expect(isOrderNotification({ listId: "l1" })).toBe(true);
    expect(isOrderNotification({ listId: "l1", type: "new_message" })).toBe(
      true,
    );
  });

  it("is false for a broadcast, so it never reloads the lists", () => {
    expect(isOrderNotification({ type: "broadcast", target: "home" })).toBe(
      false,
    );
    expect(
      isOrderNotification({ type: "broadcast", target: "home", listId: "l1" }),
    ).toBe(false);
  });

  it("is false for junk", () => {
    expect(isOrderNotification(null)).toBe(false);
    expect(isOrderNotification("listId")).toBe(false);
    expect(isOrderNotification({})).toBe(false);
  });
});
