/**
 * What actually goes to Expo: batch sizes, the logo, and the channel.
 *
 * @remarks
 * `fetch` is replaced, so every request body can be read back. The `User`
 * model is replaced so `notifyUser` - the order-update path - can be checked
 * to send on the default channel.
 *
 * @packageDocumentation
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let storedTokens: string[] = [];

vi.mock("../models/User", () => ({
  User: {
    findById: () => ({
      select: () => ({ lean: async () => ({ pushTokens: storedTokens }) }),
    }),
  },
}));

import {
  EXPO_MAX_BATCH,
  notifyUser,
  PUSH_LOGO_URL,
  sendPushNotifications,
} from "./push";

type SentMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  richContent?: { image: string };
};

let requests: SentMessage[][] = [];
const fetchMock = vi.fn(async (_url: string, init: { body: string }) => {
  requests.push(JSON.parse(init.body) as SentMessage[]);
  return new Response("{}", { status: 200 });
});

const token = (n: number) => `ExponentPushToken[device-${n}]`;

beforeEach(() => {
  requests = [];
  storedTokens = [];
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendPushNotifications", () => {
  it("splits 250 devices into three requests of at most 100", async () => {
    const tokens = Array.from({ length: 250 }, (_, i) => token(i));

    const attempted = await sendPushNotifications(tokens, "Offer", "Atta 10% off", {
      type: "broadcast",
      target: "home",
    }, { channelId: "offers" });

    expect(attempted).toBe(250);
    expect(requests.map((batch) => batch.length)).toEqual([100, 100, 50]);
    expect(Math.max(...requests.map((batch) => batch.length))).toBeLessThanOrEqual(
      EXPO_MAX_BATCH,
    );
    const everyone = requests.flat();
    expect(new Set(everyone.map((m) => m.to)).size).toBe(250);
    for (const message of everyone) {
      expect(message.richContent).toEqual({ image: PUSH_LOGO_URL });
      expect(message.channelId).toBe("offers");
    }
  });

  it("drops malformed tokens and duplicates before counting", async () => {
    const attempted = await sendPushNotifications(
      [token(1), token(1), "not-a-token", "", token(2), "ExpoPushToken[x]"],
      "t",
      "b",
    );

    expect(attempted).toBe(3);
    expect(requests).toHaveLength(1);
    expect(requests[0].map((m) => m.to)).toEqual([token(1), token(2), "ExpoPushToken[x]"]);
  });

  it("makes no request when there is nobody to send to", async () => {
    expect(await sendPushNotifications([], "t", "b")).toBe(0);
    expect(await sendPushNotifications(["junk"], "t", "b")).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws, and keeps sending later batches after one fails", async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new Error("network down");
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const tokens = Array.from({ length: 150 }, (_, i) => token(i));

    const attempted = await sendPushNotifications(tokens, "t", "b");

    expect(attempted).toBe(150);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it("uses a caller's image instead of the logo when given one", async () => {
    await sendPushNotifications([token(1)], "t", "b", undefined, {
      image: "https://example.com/x.png",
    });
    expect(requests[0][0].richContent).toEqual({ image: "https://example.com/x.png" });
  });
});

describe("notifyUser (order updates)", () => {
  it("sends on the default channel, with the logo", async () => {
    storedTokens = [token(7)];

    await notifyUser("64f0000000000000abcd1234", "Order packed", "Ready for pickup", {
      type: "order",
    });

    expect(requests).toHaveLength(1);
    const [message] = requests[0];
    expect(message).not.toHaveProperty("channelId");
    expect(message.richContent).toEqual({ image: PUSH_LOGO_URL });
    expect(message.data).toEqual({ type: "order" });
  });
});
