/**
 * An append-only record of what was done behind the counter, and by whom.
 *
 * @remarks
 * This is the control that actually deters an insider. A permission stops a
 * staff member from reaching the dashboard; nothing stops them from quoting a
 * friend's order at half price. What stops that is knowing the shopkeeper can
 * see it afterwards, with a name and a time against it.
 *
 * There is **no route that deletes or edits** one of these, by design. The
 * collection only grows, and rows expire on their own after a year through the
 * TTL index at the bottom of this file - long enough to settle an argument
 * about last Diwali, short enough that the collection never becomes the biggest
 * thing in the database.
 *
 * Writing an event must never fail a request: the caller's work has already
 * happened, and losing the receipt is better than losing the sale. See
 * `services/audit.ts`, which swallows its own errors.
 *
 * @packageDocumentation
 */
import { HydratedDocument, model, Schema, Types } from "mongoose";

/**
 * What happened.
 *
 * @remarks
 * Named after the act, not the endpoint, so the log reads as a story of the
 * shop rather than a web-server trace. Adding a value here is free; the panel
 * shows anything it does not recognise verbatim.
 */
export type AuditAction =
  | "list.priced"
  | "list.availability"
  | "list.status"
  | "list.markPaid"
  | "list.itemEdited"
  | "list.itemAdded"
  | "list.chatSent"
  | "staff.added"
  | "staff.removed"
  | "network.registered"
  | "network.removed"
  | "access.deniedOffNetwork";

/**
 * One recorded act. Notes on individual fields are beside the fields.
 *
 * @remarks
 * `actorEmail` and `actorRole` are **snapshots** taken at the time. A person
 * who is demoted from staff to customer next month must still appear in this
 * log as the staff member they were, so these are copied in rather than joined
 * from the `User` document.
 *
 * `ip` is the address the act came from, as `utils/clientIp.ts` read it. For a
 * staff member it is by definition one of the shop's registered networks,
 * which makes the odd one out worth looking at.
 *
 * `detail` is free-form and small - an amount, an item name, a status - and is
 * never shown to anyone but the shopkeeper.
 */
export type AuditEvent = {
  action: AuditAction | string;
  actor: Types.ObjectId | null; // the User who acted, if still known
  actorEmail: string; // snapshot: who they were at the time
  actorRole: string; // snapshot: the role they held at the time
  groceryList: Types.ObjectId | null; // the list acted on, when there is one
  ip: string; // where it came from
  detail: string; // a short human-readable note
  createdAt: Date;
  updatedAt: Date;
};

/** A saved event, as Mongoose hands it back. */
export type AuditEventDocument = HydratedDocument<AuditEvent>;

const AuditEventSchema = new Schema<AuditEvent>(
  {
    action: { type: String, required: true, trim: true },
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorEmail: { type: String, default: "", lowercase: true, trim: true },
    actorRole: { type: String, default: "", trim: true },
    groceryList: {
      type: Schema.Types.ObjectId,
      ref: "GroceryList",
      default: null,
    },
    ip: { type: String, default: "", trim: true },
    detail: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { timestamps: true },
);

/** The panel reads this log newest-first, and filters it by person. */
AuditEventSchema.index({ createdAt: -1 });
AuditEventSchema.index({ actorEmail: 1, createdAt: -1 });

/**
 * Events delete themselves a year after they are written.
 *
 * A year is chosen so the log outlives a festival season and any dispute that
 * follows it, without the collection growing for ever on a free database tier.
 */
AuditEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 },
);

export const AuditEventModel = model<AuditEvent>("AuditEvent", AuditEventSchema);
