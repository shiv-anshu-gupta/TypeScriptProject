/**
 * The internet connections that count as "inside the shop".
 *
 * @remarks
 * A staff member's requests are accepted only from one of these addresses; the
 * shopkeeper's are accepted from anywhere. See `middleware/shopNetwork.ts` for
 * the gate and `utils/clientIp.ts` for how the address is read.
 *
 * The addresses are **registered from inside the shop**, not configured. The
 * shopkeeper opens the panel while on the shop's connection and saves whatever
 * the server sees. That is deliberate: a small shop's broadband gets a new
 * public address every time the router reconnects, so an address written into
 * an environment variable would lock the staff out on the first power cut and
 * need a redeploy to fix.
 *
 * Several rows are allowed - broadband plus the owner's hotspot as a standby -
 * and the shopkeeper can delete one that has gone stale.
 *
 * What this proves: the caller is on the shop's internet connection. What it
 * does not prove: that the caller is physically inside the shop. Someone within
 * Wi-Fi range passes, and on carrier-grade NAT a neighbouring subscriber can
 * share the same public address.
 *
 * @packageDocumentation
 */
import { HydratedDocument, model, Schema } from "mongoose";

/**
 * One registered connection. Notes on individual fields are beside the fields.
 *
 * @remarks
 * `ip` is stored exactly as `utils/clientIp.ts` normalises it, so the stored
 * form and the compared form can never drift apart.
 *
 * `lastSeenAt` is touched whenever a request arrives from this address, which
 * is what lets the panel show "in use today" beside a row and makes a dead
 * entry obvious enough to delete.
 */
export type ShopNetwork = {
  ip: string; // normalised by utils/clientIp.ts before it is stored
  label: string; // "dukaan ka wifi", "owner hotspot"
  registeredByEmail: string; // which admin saved it
  lastSeenAt: Date | null; // last request accepted from this address
  createdAt: Date;
  updatedAt: Date;
};

/** A saved network, as Mongoose hands it back. */
export type ShopNetworkDocument = HydratedDocument<ShopNetwork>;

const ShopNetworkSchema = new Schema<ShopNetwork>(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40,
    },
    registeredByEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const ShopNetworkModel = model<ShopNetwork>(
  "ShopNetwork",
  ShopNetworkSchema,
);
