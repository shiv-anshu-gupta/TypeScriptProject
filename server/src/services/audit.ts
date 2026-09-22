/**
 * Writes the shop's audit trail.
 *
 * @remarks
 * Every function here swallows its own errors. The act being recorded has
 * already happened - the price is saved, the message is sent - so a database
 * hiccup while writing the receipt must not turn a successful request into a
 * failure the shopkeeper sees. A missing row is a smaller loss than a refused
 * sale, and the row is written after the work, never before it.
 *
 * Calls are also not awaited at the call sites, for the same reason and one
 * more: this runs on a serverless platform that freezes the function the moment
 * the response is sent, so the write is started before `res.json` and left to
 * finish inside the same invocation.
 *
 * @packageDocumentation
 */
import type { Request } from "express";
import mongoose from "mongoose";
import { AuditEventModel, type AuditAction } from "../models/AuditEvent";
import { actorOf } from "../middleware/actor";

/**
 * What else to record beside the act itself.
 */
type AuditContext = {
  /** The list this happened to, when there is one. */
  listId?: string | null;
  /** A short human-readable note: an amount, an item, a status. */
  detail?: string;
};

/**
 * Turns a string into an ObjectId, or nothing.
 *
 * @param value - A candidate id from a route parameter.
 * @returns The id, or `null` when it is absent or malformed. A bad id must not
 * throw here - the caller's work already succeeded.
 */
function toObjectId(value: string | null | undefined) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

/**
 * Records one act behind the counter.
 *
 * @param req - The request that performed it; the actor and address are read
 * from what {@link ../middleware/requirePermission.requirePermission} resolved.
 * @param action - What happened.
 * @param context - The list and a short note, when they apply.
 * @returns A promise that always resolves. It is safe to ignore.
 *
 * @example
 * ```ts
 * void recordAudit(req, "list.priced", {
 *   listId: foundList.id,
 *   detail: `₹${foundList.totalAmount}`,
 * });
 * res.json(ok({ items: await getAllGroceryLists() }));
 * ```
 */
export async function recordAudit(
  req: Request,
  action: AuditAction,
  context: AuditContext = {},
): Promise<void> {
  try {
    const actor = actorOf(req);
    await AuditEventModel.create({
      action,
      actor: toObjectId(actor?.id),
      actorEmail: actor?.email ?? "",
      actorRole: actor?.role ?? "",
      groceryList: toObjectId(context.listId),
      ip: actor?.ip ?? "",
      detail: (context.detail ?? "").slice(0, 200),
    });
  } catch {
    // Deliberately silent. See the note at the top of this file.
  }
}

/**
 * How long the same person's off-network refusals are collapsed into one row.
 *
 * @remarks
 * The panel polls every fifteen seconds. A staff member who opens it at home
 * would otherwise write four rows a minute for as long as the tab is open, and
 * bury the log. Ten minutes keeps the first attempt - which is the interesting
 * one - and drops the rest.
 */
const DENIAL_QUIET_MS = 10 * 60 * 1000;

/** Last time each person's off-network refusal was recorded, per instance. */
const lastDenial = new Map<string, number>();

/**
 * Records a staff member trying to work from outside the shop.
 *
 * @remarks
 * Throttled per person, see {@link DENIAL_QUIET_MS}. An honest staff member
 * who forgot to join the Wi-Fi produces one row, not hundreds; someone probing
 * from elsewhere every day produces one row a day, which is the pattern worth
 * seeing.
 *
 * @param req - The refused request.
 * @param ip - The address it came from.
 * @returns A promise that always resolves.
 */
export async function recordOffNetworkDenial(
  req: Request,
  ip: string,
): Promise<void> {
  const actor = actorOf(req);
  const key = actor?.email || ip || "unknown";
  const now = Date.now();
  const previous = lastDenial.get(key) ?? 0;
  if (now - previous < DENIAL_QUIET_MS) return;
  lastDenial.set(key, now);

  await recordAudit(req, "access.deniedOffNetwork", {
    detail: ip ? `from ${ip}` : "address unreadable",
  });
}
