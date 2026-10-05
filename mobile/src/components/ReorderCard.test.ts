/**
 * Which basket "Order again" offers.
 *
 * @packageDocumentation
 */
import { pickReorder } from "./ReorderCard";
import type { CustomerGroceryList } from "@/features/customer/grocery-list/types";

function list(over: Partial<CustomerGroceryList>): CustomerGroceryList {
  return {
    _id: "x",
    code: "X",
    items: [{ name: "Atta", quantity: "5 kg", price: 0, rate: 0, available: true }],
    status: "completed",
    createdAt: "2026-10-01T10:00:00.000Z",
    ...over,
  } as CustomerGroceryList;
}

describe("pickReorder", () => {
  it("offers nothing without a collected order", () => {
    expect(pickReorder([])).toBeNull();
    expect(pickReorder([list({ status: "ready" }), list({ status: "cancelled" })])).toBeNull();
  });

  it("offers the newest collected order, not the newest order", () => {
    const picked = pickReorder([
      list({ _id: "old", createdAt: "2026-09-01T10:00:00.000Z" }),
      list({ _id: "new", createdAt: "2026-10-02T10:00:00.000Z" }),
      list({ _id: "live", status: "packing", createdAt: "2026-10-04T10:00:00.000Z" }),
    ]);
    expect(picked?.list._id).toBe("new");
  });

  it("leaves out what the shop could not supply", () => {
    const picked = pickReorder([
      list({
        items: [
          { name: "Atta", quantity: "5 kg", price: 240, rate: 48, available: true },
          { name: "Maggie", quantity: "1", price: 0, rate: 0, available: false },
        ],
      }),
    ]);
    expect(picked?.items.map((item) => item.name)).toEqual(["Atta"]);
  });

  it("offers nothing when every item was unavailable", () => {
    expect(
      pickReorder([list({ items: [{ name: "Maggie", quantity: "1", price: 0, rate: 0, available: false }] })]),
    ).toBeNull();
  });
});
