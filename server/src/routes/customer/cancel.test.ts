/**
 * A customer cancelling their own order, over real HTTP.
 *
 * @remarks
 * This is the money path: a customer who has paid by UPI must be able to
 * withdraw, and the shop must be told to refund. The router is mounted in a
 * real Express app; only sign-in, the database and the notification services
 * are replaced.
 *
 * @packageDocumentation
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeList = {
  _id: string;
  user: string;
  items: { name: string; quantity: string; price: number }[];
  status: string;
  paymentStatus: string;
  totalAmount: number;
  save: () => Promise<void>;
};

let lists: FakeList[] = [];
const telegram: string[] = [];
const pushes: string[] = [];

function makeList(over: Partial<FakeList>): FakeList {
  return {
    _id: "64f0000000000000abcd1234",
    user: "me",
    items: [{ name: "Atta", quantity: "5 kg", price: 240 }],
    status: "received",
    paymentStatus: "pending",
    totalAmount: 0,
    save: async () => {},
    ...over,
  };
}

vi.mock("../../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  getDbUserFromReq: async () => ({ _id: "me", name: "Ramesh <b>", email: "r@example.com" }),
}));
vi.mock("../../models/GroceryList", () => ({
  GroceryList: {
    findOne: async ({ _id, user }: { _id: string; user: string }) =>
      lists.find((list) => list._id === _id && list.user === user) ?? null,
  },
}));
vi.mock("../../models/Message", () => ({ Message: {} }));
vi.mock("../../services/photo-list-parser", () => ({ parseGroceryListPhotos: async () => ({}) }));
vi.mock("../../services/rateLimit", () => ({ consume: async () => {} }));
vi.mock("../../utils/webPush", () => ({
  notifyAdmins: async (title: string, body: string) => {
    pushes.push(`${title} | ${body}`);
  },
}));
vi.mock("../../utils/telegram", async () => {
  const actual = await vi.importActual<typeof import("../../utils/telegram")>("../../utils/telegram");
  return {
    escapeTelegram: actual.escapeTelegram,
    sendTelegram: async (text: string) => {
      telegram.push(text);
    },
  };
});

import { customerGroceryListRouter } from "./grocery-list.routes";
import { errorHandler } from "../../middleware/errorhandler";

const app = express();
app.use(express.json());
app.use("/customer", customerGroceryListRouter);
app.use(errorHandler);

const ID = "64f0000000000000abcd1234";
const cancel = () => request(app).patch(`/customer/grocery-lists/${ID}/cancel`);

beforeEach(() => {
  lists = [];
  telegram.length = 0;
  pushes.length = 0;
});

describe("PATCH /customer/grocery-lists/:id/cancel", () => {
  it.each(["received", "priced"])("cancels a %s order and tells the shop not to pack it", async (status) => {
    lists = [makeList({ status })];

    const res = await cancel();

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
    expect(lists[0].status).toBe("cancelled");
    expect(telegram).toHaveLength(1);
    expect(telegram[0]).toContain("#ABCD1234");
    expect(telegram[0]).toContain("Not paid");
    expect(pushes).toHaveLength(1);
  });

  it("cancels a PAID order and tells the shop to refund it", async () => {
    lists = [makeList({ status: "priced", paymentStatus: "paid", totalAmount: 467 })];

    const res = await cancel();

    expect(res.status).toBe(200);
    expect(lists[0].status).toBe("cancelled");
    expect(telegram[0]).toContain("PAID (Rs 467)");
    expect(telegram[0]).toContain("refund");
    expect(pushes[0]).toContain("Refund Rs 467");
  });

  it.each(["packing", "packed", "ready", "completed"])(
    "refuses once the order is %s, and changes nothing",
    async (status) => {
      lists = [makeList({ status })];

      const res = await cancel();

      expect(res.status).toBe(400);
      expect(res.body.message ?? JSON.stringify(res.body)).toMatch(/started packing/);
      expect(lists[0].status).toBe(status);
      expect(telegram).toEqual([]);
    },
  );

  it("is harmless to repeat", async () => {
    lists = [makeList({ status: "cancelled" })];

    const res = await cancel();

    expect(res.status).toBe(200);
    expect(telegram).toEqual([]);
  });

  it("will not touch someone else's order", async () => {
    lists = [makeList({ user: "someone-else" })];

    const res = await cancel();

    expect(res.status).toBe(404);
    expect(lists[0].status).toBe("received");
  });

  it("escapes the customer's name in the shop's Telegram", async () => {
    lists = [makeList({})];

    await cancel();

    expect(telegram[0]).toContain("Ramesh &lt;b&gt;");
    expect(telegram[0]).not.toContain("Ramesh <b>");
  });
});
