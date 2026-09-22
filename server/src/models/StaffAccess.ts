/**
 * The people the shopkeeper has let behind the counter.
 *
 * @remarks
 * One document per email address the shop has granted staff access to. It is
 * an invitation list, not an account: the person still signs in through Clerk
 * like anyone else, and `services/user-sync.ts` turns a match here into the
 * `staff` role on their `User` document.
 *
 * Keeping the grant in its own collection, rather than only on the `User`, buys
 * two things. A shopkeeper can add someone who has never opened the app - the
 * row waits for them - and removing access is one delete plus one role reset,
 * with no scan of the user collection.
 *
 * Email is matched **lowercased**, because that is the form `user-sync.ts`
 * stores and compares. `admin` is never granted from here: that stays with the
 * `ADMIN_EMAILS` environment variable, so nobody can promote themselves to
 * shopkeeper from inside the app.
 *
 * @packageDocumentation
 */
import { HydratedDocument, model, Schema } from "mongoose";

/**
 * One granted staff member. Notes on individual fields are beside the fields.
 *
 * @remarks
 * `name` is the shopkeeper's own label for the person ("Raju, evening shift"),
 * written when adding them. It is not the name on their Clerk account, which
 * may be anything, and it exists so the staff list reads like the shop's own
 * roster.
 *
 * `addedByEmail` is a snapshot of who granted the access, kept even if that
 * admin's own record later changes.
 */
export type StaffAccess = {
  email: string; // lowercased; matched against the Clerk primary email
  name: string; // the shopkeeper's label for this person
  addedByEmail: string; // which admin granted it
  createdAt: Date;
  updatedAt: Date;
};

/** A saved grant, as Mongoose hands it back. */
export type StaffAccessDocument = HydratedDocument<StaffAccess>;

const StaffAccessSchema = new Schema<StaffAccess>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: 60,
    },
    addedByEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

/**
 * The staff roster, newest grant first.
 *
 * The collection is tiny - a kirana shop has a handful of staff - so this index
 * is about a predictable order in the panel, not about speed.
 */
StaffAccessSchema.index({ createdAt: -1 });

export const StaffAccessModel = model<StaffAccess>(
  "StaffAccess",
  StaffAccessSchema,
);
