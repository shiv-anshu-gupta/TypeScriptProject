import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

// A chat message tied to one grocery list/order. Either the customer or the
// shop ("staff") can send. Kept in its own collection (not embedded in the
// list) so a long conversation never bloats the order document.
export type MessageSender = "customer" | "staff";

export type Message = {
  groceryList: Types.ObjectId; // the order this chat belongs to
  user: Types.ObjectId; // the customer who owns the order (for scoping/push)
  sender: MessageSender;
  senderName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

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

export const Message =
  mongoose.models.Message || model<Message>("Message", MessageSchema);
