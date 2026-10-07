/**
 * The shopkeeper's notification to every customer, over real HTTP.
 *
 * @remarks
 * The router is mounted in a real Express app. Sign-in, the permission gate,
 * the database and the push sender are replaced: the gate is covered by
 * `auth/permissions.test.ts` and `gates.test.ts`, and the sender by
 * `utils/push.test.ts`. What is left is what this file is for - validation,
 * the once-a-day rule, and who receives what.
 *
 * @packageDocumentation
 */
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CATEGORY_ID = "64f0000000000000000000c1";
const ACTIVE_PRODUCT_ID = "64f0000000000000000000a1";
const HIDDEN_PRODUCT_ID = "64f0000000000000000000a2";
const UNKNOWN_ID = "64f0000000000000000000ff";

type Row = Record<string, unknown> & { _id: string; dayKey?: string; createdAt: Date };
type FakeUser = { _id: string; role: string; email: string; pushTokens: string[] };

let broadcasts: Row[] = [];
let users: FakeUser[] = [];
let me: FakeUser;
let receiptChecks = 0;
let nextId = 1;
const sends: Array<{
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  options: Record<string, unknown>;
}> = [];
const audits: Array<{ action: string; detail?: string }> = [];
let testConsumed = 0;

vi.mock("../../middleware/auth", () => ({
  requireAuth: (_req: unknown, _res: unknown, next: () => void) => next(),
  getDbUserFromReq: async () => me,
}));
vi.mock("../../middleware/requirePermission", () => ({
  requirePermission: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock("../../services/audit", () => ({
  recordAudit: async (_req: unknown, action: string, context: { detail?: string }) => {
    audits.push({ action, detail: context?.detail });
  },
}));
vi.mock("../../services/rateLimit", async () => {
  const { AppError } = await import("../../utils/AppError");
  return {
    consume: async (name: string) => {
      if (name !== "broadcastTest") throw new Error(`unexpected limit ${name}`);
      testConsumed += 1;
      if (testConsumed > 20) throw new AppError(429, "too many tests");
    },
  };
});
vi.mock("../../utils/push", () => ({
  sendPushNotifications: async (
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, unknown>,
    options: Record<string, unknown>,
  ) => {
    sends.push({ tokens, title, body, data, options });
    return new Set(tokens.filter((t) => t.startsWith("ExponentPushToken["))).size;
  },
  checkPushReceipts: async () => {
    receiptChecks += 1;
    return 0;
  },
}));
vi.mock("../../models/Category", () => ({
  Category: { exists: async ({ _id }: { _id: string }) => (_id === CATEGORY_ID ? { _id } : null) },
}));
vi.mock("../../models/Product", () => ({
  Product: {
    exists: async ({ _id, status }: { _id: string; status: string }) => {
      const catalogue: Record<string, string> = {
        [ACTIVE_PRODUCT_ID]: "active",
        [HIDDEN_PRODUCT_ID]: "inactive",
      };
      return catalogue[_id] === status ? { _id } : null;
    },
  },
}));
vi.mock("../../models/User", () => {
  const audience = () =>
    users.filter(
      (u) => u.pushTokens.some((t) => /^Expo(nent)?PushToken\[/.test(t)),
    );
  return {
    User: {
      countDocuments: async () => audience().length,
      find: () => ({
        select: () => ({ lean: async () => audience().map((u) => ({ pushTokens: u.pushTokens })) }),
      }),
    },
  };
});
vi.mock("../../models/Broadcast", async () => {
  const actual = await vi.importActual<typeof import("../../models/Broadcast")>(
    "../../models/Broadcast",
  );
  return {
    ...actual,
    BroadcastModel: {
      exists: async ({ dayKey }: { dayKey: string }) =>
        broadcasts.find((b) => b.dayKey === dayKey) ?? null,
      create: async (doc: Record<string, unknown>) => {
        // The unique index on dayKey.
        if (doc.dayKey && broadcasts.some((b) => b.dayKey === doc.dayKey)) {
          throw Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
        }
        const row = {
          ...doc,
          _id: `b${String(nextId).padStart(23, "0")}`,
          createdAt: new Date(Date.now() + nextId),
        } as Row;
        nextId += 1;
        broadcasts.push(row);
        return row;
      },
      updateOne: async ({ _id }: { _id: string }, { $set }: { $set: Record<string, unknown> }) => {
        const row = broadcasts.find((b) => b._id === _id);
        if (row) Object.assign(row, $set);
      },
      deleteOne: async ({ _id }: { _id: string }) => {
        broadcasts = broadcasts.filter((b) => b._id !== _id);
      },
      find: () => ({
        sort: () => ({
          limit: (n: number) => ({
            lean: async () =>
              [...broadcasts]
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, n),
          }),
        }),
      }),
    },
  };
});

import {
  adminBroadcastRouter,
  DAILY_LIMIT_MESSAGE,
  istDayKey,
  nextIstMidnight,
  NO_DEVICE_MESSAGE,
} from "./broadcast.routes";
import { errorHandler } from "../../middleware/errorhandler";

const app = express();
app.use(express.json());
app.use("/admin", adminBroadcastRouter);
app.use(errorHandler);

const valid = { title: "Diwali offer", body: "10% off on all sweets today.", target: { type: "home" } };
const sendAll = (body: unknown = valid) => request(app).post("/admin/broadcasts").send(body as object);
const sendTest = (body: unknown = valid) =>
  request(app).post("/admin/broadcasts/test").send(body as object);
const messageOf = (res: request.Response) => String(res.body?.errors?.[0]?.message ?? "");

/** 2026-10-07 12:00 IST. */
const NOON_IST = Date.UTC(2026, 9, 7, 6, 30);

beforeEach(() => {
  broadcasts = [];
  sends.length = 0;
  audits.length = 0;
  testConsumed = 0;
  nextId = 1;
  me = {
    _id: "64f00000000000000000ad01",
    role: "admin",
    email: "owner@skirana.com",
    pushTokens: ["ExponentPushToken[admin-phone]"],
  };
  users = [
    me,
    { _id: "u1", role: "user", email: "a@x.com", pushTokens: ["ExponentPushToken[a1]", "ExponentPushToken[a2]"] },
    { _id: "u2", role: "user", email: "b@x.com", pushTokens: ["ExponentPushToken[b1]", "junk"] },
    { _id: "u3", role: "user", email: "c@x.com", pushTokens: [] },
    { _id: "s1", role: "staff", email: "s@x.com", pushTokens: ["ExponentPushToken[staff]"] },
  ];
  vi.spyOn(Date, "now").mockReturnValue(NOON_IST);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the Indian calendar day", () => {
  it("turns over at 18:30 UTC, which is midnight in India", () => {
    expect(istDayKey(Date.UTC(2026, 9, 7, 18, 29))).toBe("2026-10-07");
    expect(istDayKey(Date.UTC(2026, 9, 7, 18, 30))).toBe("2026-10-08");
    expect(istDayKey(Date.UTC(2026, 9, 7, 18, 31))).toBe("2026-10-08");
    expect(istDayKey(Date.UTC(2026, 9, 7, 0, 0))).toBe("2026-10-07");
  });

  it("rolls over months and years", () => {
    expect(istDayKey(Date.UTC(2026, 11, 31, 18, 31))).toBe("2027-01-01");
    expect(istDayKey(Date.UTC(2026, 9, 31, 18, 29))).toBe("2026-10-31");
  });

  it("names the next midnight in India as a UTC instant", () => {
    expect(nextIstMidnight(Date.UTC(2026, 9, 7, 18, 29)).toISOString()).toBe(
      "2026-10-07T18:30:00.000Z",
    );
    expect(nextIstMidnight(Date.UTC(2026, 9, 7, 18, 31)).toISOString()).toBe(
      "2026-10-08T18:30:00.000Z",
    );
  });
});

describe("validation, on both sends", () => {
  const cases: Array<[string, unknown, RegExp]> = [
    ["an empty title", { ...valid, title: "   " }, /title/i],
    ["a 51-character title", { ...valid, title: "x".repeat(51) }, /at most 50/],
    ["an empty message", { ...valid, body: "\n\t" }, /message/i],
    ["a 181-character message", { ...valid, body: "x".repeat(181) }, /at most 180/],
    ["an unknown target", { ...valid, target: { type: "orders" } }, /where the notification opens/],
    ["no target", { title: "a", body: "b" }, /where the notification opens/],
    ["a category with no id", { ...valid, target: { type: "category" } }, /Choose a category/],
    ["a category with a malformed id", { ...valid, target: { type: "category", targetId: "x" } }, /Choose a category/],
    ["a category that does not exist", { ...valid, target: { type: "category", targetId: UNKNOWN_ID } }, /category no longer exists/],
    ["a product with no id", { ...valid, target: { type: "product" } }, /Choose a product/],
    ["a product that does not exist", { ...valid, target: { type: "product", targetId: UNKNOWN_ID } }, /not on sale/],
    ["an inactive product", { ...valid, target: { type: "product", targetId: HIDDEN_PRODUCT_ID } }, /not on sale/],
  ];

  it.each(cases)("refuses %s to everyone, and sends nothing", async (_name, body, message) => {
    const res = await sendAll(body);
    expect(res.status).toBe(400);
    expect(messageOf(res)).toMatch(message);
    expect(sends).toEqual([]);
    expect(broadcasts).toEqual([]);
  });

  it.each(cases)("refuses %s as a test, and sends nothing", async (_name, body, message) => {
    const res = await sendTest(body);
    expect(res.status).toBe(400);
    expect(messageOf(res)).toMatch(message);
    expect(sends).toEqual([]);
  });

  it("accepts exactly 50 and 180 characters", async () => {
    const res = await sendTest({ ...valid, title: "t".repeat(50), body: "b".repeat(180) });
    expect(res.status).toBe(200);
  });

  it("strips control characters and trims before measuring", async () => {
    const res = await sendTest({
      ...valid,
      title: `  Fresh\u0000 mangoes\n  `,
      body: "Line one\r\nLine\u0007 two",
    });
    expect(res.status).toBe(200);
    expect(sends[0].title).toBe("Fresh mangoes");
    expect(sends[0].body).toBe("Line one Line two");
  });

  it("opens an existing category and an active product", async () => {
    const category = await sendTest({ ...valid, target: { type: "category", targetId: CATEGORY_ID } });
    const product = await sendTest({ ...valid, target: { type: "product", targetId: ACTIVE_PRODUCT_ID } });

    expect(category.status).toBe(200);
    expect(product.status).toBe(200);
    expect(sends[0].data).toEqual({ type: "broadcast", target: "category", targetId: CATEGORY_ID });
    expect(sends[1].data).toEqual({ type: "broadcast", target: "product", targetId: ACTIVE_PRODUCT_ID });
  });

  it("drops a targetId the target type does not use", async () => {
    await sendTest({ ...valid, target: { type: "writeList", targetId: CATEGORY_ID } });
    expect(sends[0].data).toEqual({ type: "broadcast", target: "writeList" });
  });
});

describe("POST /admin/broadcasts/test", () => {
  it("goes only to the calling admin's own phone, on the default channel", async () => {
    const res = await sendTest();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ recipients: 1 });
    expect(sends).toHaveLength(1);
    expect(sends[0].tokens).toEqual(["ExponentPushToken[admin-phone]"]);
    expect(sends[0].options).toEqual({});
    expect(sends[0].data).toEqual({ type: "broadcast", target: "home" });
    expect(broadcasts[0]).toMatchObject({ kind: "test", recipients: 1, sentByEmail: "owner@skirana.com" });
    expect(broadcasts[0].dayKey).toBeUndefined();
    expect(audits).toEqual([{ action: "broadcast.test", detail: "Diwali offer" }]);
  });

  it("refuses with 400 when the admin has no phone registered", async () => {
    me.pushTokens = ["junk"];

    const res = await sendTest();

    expect(res.status).toBe(400);
    expect(messageOf(res)).toBe(NO_DEVICE_MESSAGE);
    expect(sends).toEqual([]);
    expect(testConsumed).toBe(0);
  });

  it("does not use up the day's send to everyone", async () => {
    await sendTest();
    await sendTest();
    const res = await sendAll();
    expect(res.status).toBe(200);
  });

  it("stops after 20 a day", async () => {
    for (let i = 0; i < 20; i += 1) expect((await sendTest()).status).toBe(200);
    const res = await sendTest();
    expect(res.status).toBe(429);
    expect(sends).toHaveLength(20);
  });
});

describe("POST /admin/broadcasts", () => {
  it("goes to every account's phone - customers, staff and admins - on the default channel", async () => {
    const res = await sendAll();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ recipients: 5 });
    expect(sends).toHaveLength(1);
    expect(sends[0].tokens.sort()).toEqual(
      [
        "ExponentPushToken[admin-phone]",
        "ExponentPushToken[a1]",
        "ExponentPushToken[a2]",
        "ExponentPushToken[b1]",
        "junk",
        "ExponentPushToken[staff]",
      ].sort(),
    );
    expect(sends[0].options).toEqual({});
    expect(broadcasts[0]).toMatchObject({ kind: "all", recipients: 5, dayKey: "2026-10-07" });
    expect(audits).toEqual([{ action: "broadcast.sent", detail: "Diwali offer" }]);
  });

  it("refuses a second send the same day in India, and sends nothing", async () => {
    expect((await sendAll()).status).toBe(200);

    vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 9, 7, 18, 29)); // 23:59 IST
    const res = await sendAll({ ...valid, title: "Another" });

    expect(res.status).toBe(429);
    expect(messageOf(res)).toBe(DAILY_LIMIT_MESSAGE);
    expect(sends).toHaveLength(1);
    expect(broadcasts).toHaveLength(1);
  });

  it("allows the next send once it is tomorrow in India", async () => {
    expect((await sendAll()).status).toBe(200);

    vi.spyOn(Date, "now").mockReturnValue(Date.UTC(2026, 9, 7, 18, 31)); // 00:01 IST, 8 Oct
    const res = await sendAll();

    expect(res.status).toBe(200);
    expect(broadcasts.map((b) => b.dayKey)).toEqual(["2026-10-07", "2026-10-08"]);
  });

  it("lets only one of two simultaneous clicks through", async () => {
    const [a, b] = await Promise.all([sendAll(), sendAll()]);

    expect([a.status, b.status].sort()).toEqual([200, 429]);
    expect(sends).toHaveLength(1);
  });
});

describe("GET /admin/broadcasts", () => {
  it("reports the audience, today's allowance and the limits", async () => {
    const res = await request(app).get("/admin/broadcasts");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      audience: 4,
      canSendToday: true,
      nextAllowedAt: null,
      limits: { titleMax: 50, bodyMax: 180, perDay: 1 },
      history: [],
    });
  });

  it("says when the next send may go, and lists history newest first", async () => {
    await sendTest({ ...valid, title: "First" });
    await sendAll({ ...valid, title: "Second", target: { type: "category", targetId: CATEGORY_ID } });

    const res = await request(app).get("/admin/broadcasts");
    const data = res.body.data;

    expect(data.canSendToday).toBe(false);
    expect(data.nextAllowedAt).toBe("2026-10-07T18:30:00.000Z");
    expect(data.history).toHaveLength(2);
    expect(data.history[0]).toMatchObject({
      title: "Second",
      kind: "all",
      recipients: 5,
      sentByEmail: "owner@skirana.com",
      target: { type: "category", targetId: CATEGORY_ID },
    });
    expect(typeof data.history[0]._id).toBe("string");
    expect(typeof data.history[0].createdAt).toBe("string");
    expect(data.history[1]).toMatchObject({ title: "First", kind: "test", target: { type: "home" } });
  });
});
