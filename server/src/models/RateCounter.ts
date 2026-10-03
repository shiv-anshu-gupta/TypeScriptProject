/**
 * How many times one customer has done one thing in the current window.
 *
 * @remarks
 * The brake on someone who wants to make trouble from a real account: a
 * thousand lists in an evening, each one ringing the shop's phone. A counter
 * in process memory would not do it, because Vercel runs several copies of the
 * server and each would count on its own. A counter here is shared by all of
 * them.
 *
 * One document per customer, per action, per window. `key` is
 * `<action>:<userId>:<windowStart>`, so a new window is simply a new key and
 * nothing ever has to be reset. Old windows delete themselves through the TTL
 * index on `expiresAt`.
 *
 * See `services/rateLimit.ts`, the only writer.
 *
 * @packageDocumentation
 */
import { model, Schema } from "mongoose";

export type RateCounter = {
  key: string;
  count: number;
  expiresAt: Date;
};

const RateCounterSchema = new Schema<RateCounter>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

RateCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateCounterModel = model<RateCounter>("RateCounter", RateCounterSchema);
