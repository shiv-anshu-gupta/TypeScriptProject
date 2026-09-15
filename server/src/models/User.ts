import mongoose from "mongoose";

export type UserRole = "user" | "admin";

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  },
);

const UserSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: false,
    },
    // One record per email: the database has a unique index on it (email_1),
    // declared here so the code says what the database enforces. It's what
    // lets a returning customer be re-linked by email after a Clerk instance
    // change (services/user-sync.ts). Records without an email count as null,
    // so phone-only sign-up will need this made sparse/partial first.
    email: {
      type: String,
      required: false,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Customer's mobile number so the shop can call about an order. Collected
    // once, the first time they send a list.
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    // Expo push tokens — one per device the user has signed in on.
    pushTokens: {
      type: [String],
      default: [],
    },
    // Firebase Cloud Messaging web-push tokens — for the admin browser to be
    // alerted of new orders (one per browser/device the admin signed in on).
    webPushTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
