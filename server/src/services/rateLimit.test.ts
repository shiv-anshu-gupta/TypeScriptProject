/**
 * The per-customer ceilings.
 *
 * @remarks
 * The database is replaced by a map that does what the real `$inc` upsert
 * does, so these tests are about the rule - when to refuse, and that one
 * customer's count never touches another's - not about Mongo.
 *
 * @packageDocumentation
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const counts = new Map<string, number>();
let databaseDown = false;

vi.mock("../models/RateCounter", () => ({
  RateCounterModel: {
    findOneAndUpdate: ({ key }: { key: string }) => ({
      lean: async () => {
        if (databaseDown) throw new Error("connection refused");
        const next = (counts.get(key) ?? 0) + 1;
        counts.set(key, next);
        return { key, count: next };
      },
    }),
  },
}));

import { consume, LIMITS } from "./rateLimit";

const NOON = Date.UTC(2026, 9, 3, 12, 0, 0);

beforeEach(() => {
  counts.clear();
  databaseDown = false;
});

describe("consume", () => {
  it("allows a customer up to the ceiling, and refuses the one after", async () => {
    for (let i = 0; i < LIMITS.listSend.max; i += 1) {
      await consume("listSend", "u1", NOON);
    }
    await expect(consume("listSend", "u1", NOON)).rejects.toMatchObject({
      statusCode: 429,
      message: LIMITS.listSend.message,
    });
  });

  it("counts each customer separately", async () => {
    for (let i = 0; i < LIMITS.listSend.max; i += 1) {
      await consume("listSend", "u1", NOON);
    }
    await expect(consume("listSend", "u2", NOON)).resolves.toBeUndefined();
  });

  it("counts each action separately", async () => {
    for (let i = 0; i < LIMITS.chat.max; i += 1) {
      await consume("chat", "u1", NOON);
    }
    await expect(consume("listSend", "u1", NOON)).resolves.toBeUndefined();
  });

  it("starts again in the next window", async () => {
    for (let i = 0; i < LIMITS.chat.max; i += 1) {
      await consume("chat", "u1", NOON);
    }
    await expect(consume("chat", "u1", NOON)).rejects.toMatchObject({ statusCode: 429 });
    await expect(consume("chat", "u1", NOON + LIMITS.chat.windowMs)).resolves.toBeUndefined();
  });

  it("lets the request through when the count cannot be taken", async () => {
    databaseDown = true;
    await expect(consume("listSend", "u1", NOON)).resolves.toBeUndefined();
  });

  it("sets every ceiling well above an ordinary day", () => {
    expect(LIMITS.listSend.max).toBeGreaterThanOrEqual(10);
    expect(LIMITS.chat.max).toBeGreaterThanOrEqual(20);
    expect(LIMITS.photoRead.max).toBeGreaterThanOrEqual(10);
  });
});
