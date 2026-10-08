/**
 * A notification the shopkeeper sent to customers' phones from the panel.
 *
 * @remarks
 * Two kinds. A `test` goes only to the sending admin's own phone, so they can
 * see exactly what customers will see before committing. An `all` goes to
 * every customer with the app installed and notifications allowed.
 *
 * An `all` is limited to **one per calendar day in India**, across every
 * admin. A shop that notifies its customers twice a day gets its app muted or
 * uninstalled, and that costs far more than the second offer could earn. The
 * limit is enforced by the unique index on `dayKey` at the bottom of this
 * file: the route writes this record *before* sending, so two clicks racing
 * each other cannot both get through - the second insert fails on the index.
 *
 * Written only by routes/admin/broadcast.routes.ts. There is no route that
 * edits or deletes one; the record is the shop's history of what it sent.
 *
 * @packageDocumentation
 */
import { HydratedDocument, model, Schema, Types } from "mongoose";

/**
 * Where a tap on the notification takes the customer in the app.
 *
 * @remarks
 * The meaning of each value is on the line beside it. `category` and
 * `product` need a `targetId`; the route checks it exists (and, for a product,
 * that it is on sale) before anything is sent.
 */
export const BROADCAST_TARGET_TYPES = [
  "home", // the Home tab
  "products", // the Shop tab
  "writeList", // opens the "write your list" sheet
  "category", // the Shop tab filtered to one category (targetId)
  "product", // one product's page (targetId)
] as const;

/** One of {@link BROADCAST_TARGET_TYPES}. */
export type BroadcastTargetType = (typeof BROADCAST_TARGET_TYPES)[number];

/**
 * The tap target, as stored and as sent in the push `data`.
 *
 * @remarks
 * `targetId` is held as a plain string, like a banner's, so the history row
 * survives the category or product being deleted later.
 */
export type BroadcastTarget =
  | { type: "home" }
  | { type: "products" }
  | { type: "writeList" }
  | { type: "category"; targetId: string }
  | { type: "product"; targetId: string };

/** `test` - to the sender's own phone; `all` - to every customer. */
export type BroadcastKind = "test" | "all";

/**
 * How the notification looks on the phone.
 *
 * @remarks
 * Title and message are always sent too: lock screens, screen readers and
 * app versions before 1.0.5 use them.
 */
export const BROADCAST_STYLES = [
  "text", // title and message, with the sKirana logo
  "picture", // title and message, plus a 2:1 picture (thumbnail, big when pulled down)
  "banner", // a 4:1 full-width picture is the whole notification (app 1.0.5+)
] as const;

/** One of {@link BROADCAST_STYLES}. */
export type BroadcastStyle = (typeof BROADCAST_STYLES)[number];

/**
 * One sent notification. Field notes are beside the fields.
 *
 * @remarks
 * `sentByEmail` is a snapshot, like the audit trail's, so the history still
 * names the person after they are removed as an admin.
 *
 * `recipients` is the number of devices the notification was handed to Expo
 * for, not the number that displayed it; Expo's delivery receipts are not
 * read. For an `all` it is `0` for the moment between the reservation and the
 * send finishing.
 */
export type Broadcast = {
  title: string;
  body: string;
  target: { type: BroadcastTargetType; targetId?: string };
  kind: BroadcastKind;
  style?: BroadcastStyle; // absent on records from before styles: imageUrl ? banner : text
  imageUrl?: string; // picture (our Cloudinary); set only for picture/banner
  recipients: number; // devices handed to Expo
  sentBy: Types.ObjectId; // the admin who sent it
  sentByEmail: string; // snapshot: who they were at the time
  dayKey?: string; // "YYYY-MM-DD" in India; set only for kind "all"
  createdAt: Date;
  updatedAt: Date;
};

/** A saved broadcast, as Mongoose hands it back. */
export type BroadcastDocument = HydratedDocument<Broadcast>;

const BroadcastSchema = new Schema<Broadcast>(
  {
    title: { type: String, required: true, trim: true, maxlength: 50 },
    body: { type: String, required: true, trim: true, maxlength: 180 },
    target: {
      type: {
        type: String,
        enum: BROADCAST_TARGET_TYPES,
        required: true,
      },
      targetId: { type: String, default: undefined },
    },
    kind: { type: String, enum: ["test", "all"], required: true },
    style: { type: String, enum: BROADCAST_STYLES, default: undefined },
    imageUrl: { type: String, default: undefined },
    recipients: { type: Number, default: 0, min: 0 },
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentByEmail: { type: String, default: "", lowercase: true, trim: true },
    dayKey: { type: String, default: undefined },
  },
  { timestamps: true },
);

/** The panel shows the history newest-first. */
BroadcastSchema.index({ createdAt: -1 });

/**
 * At most one `all` per Indian calendar day.
 *
 * Partial on `dayKey` being a string, so test sends - which carry no day key -
 * are never counted against it.
 */
BroadcastSchema.index(
  { dayKey: 1 },
  { unique: true, partialFilterExpression: { dayKey: { $type: "string" } } },
);

export const BroadcastModel = model<Broadcast>("Broadcast", BroadcastSchema);
