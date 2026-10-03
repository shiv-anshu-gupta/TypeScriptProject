/**
 * Per-customer ceilings on the things that reach the shopkeeper's phone or
 * cost money.
 *
 * @remarks
 * Every limit here is far above what a real customer does - a family sends a
 * list or two a day - and low enough that one account cannot flood the shop.
 * A customer who hits one gets a plain sentence and the action is refused
 * before anything is written or anyone is notified.
 *
 * The count is taken *before* the work, with a single atomic `$inc`, so two
 * requests racing each other cannot both slip under the line.
 *
 * If the database cannot be reached for the count, the request is allowed:
 * the brake must never be the reason a genuine order fails.
 *
 * @packageDocumentation
 */
import { RateCounterModel } from "../models/RateCounter";
import { AppError } from "../utils/AppError";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** One ceiling: how many times, in how long, and what to say when it is hit. */
export type Limit = {
  max: number;
  windowMs: number;
  message: string;
};

/**
 * The ceilings. A real customer never meets them.
 *
 * - `listSend` - a send either opens a list or adds to the open one; each
 *   rings the shop. 20 a day.
 * - `chat` - 30 messages an hour.
 * - `photoRead` - each read is a paid call to Google. 20 a day.
 */
export const LIMITS = {
  listSend: {
    max: 20,
    windowMs: DAY,
    message: "You have sent a lot of lists today. Please call the shop if you need more.",
  },
  chat: {
    max: 30,
    windowMs: HOUR,
    message: "Too many messages in a short time. Please wait a little, or call the shop.",
  },
  photoRead: {
    max: 20,
    windowMs: DAY,
    message: "You have read a lot of photos today. Please type the items instead.",
  },
} satisfies Record<string, Limit>;

export type LimitName = keyof typeof LIMITS;

/**
 * Counts one more `name` for `userId`, and refuses with 429 once the window's
 * ceiling has been passed.
 *
 * @throws AppError 429 with the limit's message.
 */
export async function consume(name: LimitName, userId: string, now = Date.now()): Promise<void> {
  const limit: Limit = LIMITS[name];
  const windowStart = Math.floor(now / limit.windowMs) * limit.windowMs;
  const key = `${name}:${userId}:${windowStart}`;

  let count: number;
  try {
    const doc = await RateCounterModel.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + limit.windowMs) } },
      { upsert: true, new: true },
    ).lean();
    count = doc?.count ?? 1;
  } catch {
    return;
  }

  if (count > limit.max) {
    throw new AppError(429, limit.message);
  }
}
