/**
 * Expo's receipt for one push, kept until we have read whether it arrived.
 *
 * @remarks
 * Expo answers a send with a ticket at once, but whether Google actually
 * delivered it is only known later, from the ticket's receipt. A receipt that
 * says "DeviceNotRegistered" means the app was uninstalled or reinstalled on
 * that phone: its token will never work again and is removed from the user.
 * Without this, dead tokens pile up and every broadcast is sent to phones
 * that no longer exist.
 *
 * Written by `utils/push.ts` on every send and read back by
 * `checkPushReceipts`. Rows expire on their own after two days, by which time
 * Expo has dropped the receipts anyway.
 *
 * @packageDocumentation
 */
import { model, Schema } from "mongoose";

export type PushTicket = {
  ticketId: string;
  token: string;
  createdAt: Date;
};

const PushTicketSchema = new Schema<PushTicket>(
  {
    ticketId: { type: String, required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false },
);

PushTicketSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 24 * 60 * 60 });

export const PushTicketModel = model<PushTicket>("PushTicket", PushTicketSchema);
