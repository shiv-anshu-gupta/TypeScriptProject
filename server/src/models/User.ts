/**
 * The app's own record of a person, alongside their Clerk account.
 *
 * @remarks
 * Clerk owns authentication and the identity fields; this record owns
 * everything the shop needs and Clerk does not hold - the phone number, the
 * role, points, addresses and push tokens. The two are joined by
 * `clerkUserId`, and services/user-sync.ts is what keeps them together.
 *
 * Unusually for this folder the schema is untyped, so `User` documents come
 * back loosely typed; {@link UserRole} is exported for callers that need to
 * name a role.
 *
 * @packageDocumentation
 */
import mongoose from "mongoose";

/**
 * What a person may do.
 *
 * @remarks
 * `admin` unlocks the whole admin panel; there is no finer permission. The
 * role is granted from the `ADMIN_EMAILS` environment variable by
 * services/user-sync.ts, never through the app, and that code only ever
 * grants - removing an email does not demote an existing admin.
 */
export type UserRole = "user" | "admin";

/**
 * One delivery address on a customer's record.
 *
 * @remarks
 * Embedded, and with `timestamps: false` because an address is replaced
 * rather than tracked. `isDefault` marks the one offered first; nothing here
 * enforces that only one carries it.
 *
 * Used by catalogue orders, which are delivered. A grocery list is collected
 * from the shop, so it does not touch these.
 */
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

/**
 * The User model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice.
 *
 * Two unique indexes, and both matter. `clerkUserId` is how every
 * authenticated request finds its record. `email` is what lets a returning
 * customer be re-linked to a new Clerk id - and also what makes creating a
 * second record for the same person fail, which is the situation
 * services/user-sync.ts exists to handle. Read the note on the `email` field
 * before making either sparse.
 *
 * Records are never deleted here; a customer who stops using the app simply
 * stops appearing.
 */
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
