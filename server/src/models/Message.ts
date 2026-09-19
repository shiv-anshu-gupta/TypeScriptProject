/**
 * The conversation between a customer and the shop about one order.
 *
 * @remarks
 * A chat message tied to one grocery list/order. Either the customer or the
 * shop ("staff") can send. Kept in its own collection (not embedded in the
 * list) so a long conversation never bloats the order document.
 *
 * Messages are not kept for ever: MongoDB deletes each one 30 days after it
 * was sent - see the TTL index near the bottom of this file.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

/**
 * Which side sent the message.
 *
 * @remarks
 * `customer` is the person who owns the order; `staff` is anyone on the shop
 * side. There is no finer distinction - the shop is one voice to the
 * customer, whoever at the counter actually typed it.
 */
export type MessageSender = "customer" | "staff";

/**
 * One message. Notes on individual fields are beside the fields.
 *
 * @remarks
 * `user` duplicates the list's owner so that a customer's messages can be
 * scoped and pushed to without reading the list first.
 *
 * `senderName` is copied in rather than looked up, so the name shown is the
 * one used at the time.
 *
 * `text` is capped at 1000 characters by the schema.
 */
export type Message = {
  groceryList: Types.ObjectId; // the order this chat belongs to
  user: Types.ObjectId; // the customer who owns the order (for scoping/push)
  sender: MessageSender;
  senderName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

/** A saved message, as Mongoose hands it back. */
export type MessageDocument = HydratedDocument<Message>;

const MessageSchema = new Schema<Message>(
  {
    groceryList: {
      type: Schema.Types.ObjectId,
      ref: "GroceryList",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: String,
      enum: ["customer", "staff"],
      required: true,
    },
    senderName: {
      type: String,
      default: "",
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

// Fetching a conversation = all messages for one list, oldest first.
MessageSchema.index({ groceryList: 1, createdAt: 1 });

// Retention: MongoDB auto-deletes each message 30 days after it was sent.
// This is a hard delete handled by the database itself — no cron, no code,
// no cost. (TTL requires a single-field index on the Date field.)
const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: THIRTY_DAYS_IN_SECONDS });

/**
 * The Message model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice.
 *
 * Nothing in the app deletes a message; the TTL index above does it.
 */
export const Message =
  mongoose.models.Message || model<Message>("Message", MessageSchema);
