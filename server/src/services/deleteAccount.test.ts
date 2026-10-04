/**
 * Account deletion: what goes, and the two things that stop it.
 *
 * @remarks
 * Each model is replaced by a small in-memory table keyed on the owning user,
 * and Clerk by a spy, so the tests can look afterwards at what is left - the
 * question that matters for a promise published to the Play Store.
 *
 * @packageDocumentation
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown> & { _id: string; user?: string };

const db: Record<string, Row[]> = {};
const telegram: string[] = [];
const clerkDeleted: string[] = [];
let clerkFails: number | null = null;

/** Does `row` match a Mongo-style filter, for the few shapes used here. */
function matches(row: Row, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([key, want]) => {
    if (key === "$or") return (want as Record<string, unknown>[]).some((f) => matches(row, f));
    const have = row[key];
    if (want && typeof want === "object" && "$nin" in want) {
      return !(want.$nin as unknown[]).includes(have);
    }
    if (want && typeof want === "object" && "$in" in want) {
      return (want.$in as unknown[]).includes(have);
    }
    return have === want;
  });
}

function table(name: string) {
  return {
    exists: async (filter: Record<string, unknown>) =>
      (db[name] ?? []).some((row) => matches(row, filter)) ? { _id: "x" } : null,
    find: (filter: Record<string, unknown>) => ({
      select: () => ({
        lean: async () => (db[name] ?? []).filter((row) => matches(row, filter)),
      }),
    }),
    deleteMany: async (filter: Record<string, unknown>) => {
      db[name] = (db[name] ?? []).filter((row) => !matches(row, filter));
    },
    deleteOne: async (filter: Record<string, unknown>) => {
      db[name] = (db[name] ?? []).filter((row) => !matches(row, filter));
    },
    updateMany: async (filter: Record<string, unknown>, update: { $set: Record<string, unknown> }) => {
      for (const row of db[name] ?? []) {
        if (matches(row, filter)) Object.assign(row, update.$set);
      }
    },
  };
}

vi.mock("../models/GroceryList", () => ({ GroceryList: table("lists") }));
vi.mock("../models/Message", () => ({ Message: table("messages") }));
vi.mock("../models/Cart", () => ({ Cart: table("carts") }));
vi.mock("../models/Wishlist", () => ({ Wishlist: table("wishlists") }));
vi.mock("../models/Order", () => ({ Order: table("orders") }));
vi.mock("../models/User", () => ({ User: table("users") }));
vi.mock("../utils/telegram", () => ({
  sendTelegram: async (text: string) => {
    telegram.push(text);
  },
}));
vi.mock("@clerk/express", () => ({
  clerkClient: {
    users: {
      deleteUser: async (id: string) => {
        if (clerkFails) throw Object.assign(new Error("clerk"), { status: clerkFails });
        clerkDeleted.push(id);
      },
    },
  },
}));

import { DELETED_CUSTOMER, deleteCustomerAccount } from "./deleteAccount";

const ME = { _id: "u1", clerkUserId: "clerk_u1", role: "user" };
const SOMEONE_ELSE = "u2";

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key];
  telegram.length = 0;
  clerkDeleted.length = 0;
  clerkFails = null;

  db.users = [{ _id: "u1" }, { _id: SOMEONE_ELSE }];
  db.lists = [
    {
      _id: "list0000done",
      user: "u1",
      status: "completed",
      paymentStatus: "paid",
      totalAmount: 467,
      customerName: "Ramesh",
      customerEmail: "r@example.com",
      customerPhone: "9876543210",
      note: "near the temple",
    },
    { _id: "theirs000001", user: SOMEONE_ELSE, status: "received", paymentStatus: "pending" },
  ];
  db.messages = [
    { _id: "m1", user: "u1", groceryList: "list0000done" },
    // the shop's reply on my list is stored against the staff member, not me
    { _id: "m2", user: "staff1", groceryList: "list0000done" },
    { _id: "m3", user: SOMEONE_ELSE, groceryList: "theirs000001" },
  ];
  db.carts = [{ _id: "c1", user: "u1" }];
  db.wishlists = [{ _id: "w1", user: "u1" }];
  db.orders = [{ _id: "o1", user: "u1" }];
});

describe("deleteCustomerAccount", () => {
  it("removes everything that is mine, and nothing that is not", async () => {
    await deleteCustomerAccount(ME);

    expect(db.users.map((r) => r._id)).toEqual([SOMEONE_ELSE]);
    expect(db.messages.map((r) => r._id)).toEqual(["m3"]);
    expect(db.carts).toEqual([]);
    expect(db.wishlists).toEqual([]);
    expect(db.orders).toEqual([]);
    expect(clerkDeleted).toEqual(["clerk_u1"]);
  });

  it("keeps my orders for the shop, with nothing left that says who I was", async () => {
    await deleteCustomerAccount(ME);

    const mine = db.lists.find((r) => r._id === "list0000done")!;
    expect(mine).toMatchObject({
      status: "completed",
      paymentStatus: "paid",
      totalAmount: 467,
      customerName: DELETED_CUSTOMER,
      customerEmail: "",
      customerPhone: "",
      note: "",
    });
    // someone else's list is untouched
    expect(db.lists.find((r) => r._id === "theirs000001")).toMatchObject({ status: "received" });
  });

  it("deletes the shop's replies on my lists too", async () => {
    await deleteCustomerAccount(ME);
    expect(db.messages.find((r) => r._id === "m2")).toBeUndefined();
  });

  it("refuses a shop account, and deletes nothing", async () => {
    for (const role of ["admin", "staff"]) {
      await expect(deleteCustomerAccount({ ...ME, role })).rejects.toMatchObject({ statusCode: 409 });
    }
    expect(db.users).toHaveLength(2);
    expect(clerkDeleted).toEqual([]);
  });

  it("refuses while a paid order waits to be collected, and deletes nothing", async () => {
    db.lists.push({ _id: "paidnotyet01", user: "u1", status: "ready", paymentStatus: "paid" });

    await expect(deleteCustomerAccount(ME)).rejects.toMatchObject({ statusCode: 409 });
    expect(db.lists).toHaveLength(3);
    expect(db.users).toHaveLength(2);
    expect(clerkDeleted).toEqual([]);
  });

  it("cancels an unpaid open order and tells the shop not to pack it", async () => {
    db.lists.push({ _id: "abcdpacking1", user: "u1", status: "packing", paymentStatus: "pending" });

    await deleteCustomerAccount(ME);

    expect(db.lists.find((r) => r._id === "abcdpacking1")).toMatchObject({
      status: "cancelled",
      customerName: DELETED_CUSTOMER,
    });
    expect(telegram).toHaveLength(1);
    expect(telegram[0]).toContain("#PACKING1");
  });

  it("says nothing to the shop when every order was already finished", async () => {
    await deleteCustomerAccount(ME);
    expect(telegram).toEqual([]);
  });

  it("treats a sign-in Clerk no longer has as already closed", async () => {
    clerkFails = 404;
    await expect(deleteCustomerAccount(ME)).resolves.toBeUndefined();
  });

  it("reports a Clerk failure after the data is gone, so the app can retry", async () => {
    clerkFails = 500;
    await expect(deleteCustomerAccount(ME)).rejects.toMatchObject({ statusCode: 502 });
    expect(db.users.map((r) => r._id)).toEqual([SOMEONE_ELSE]);
  });
});
