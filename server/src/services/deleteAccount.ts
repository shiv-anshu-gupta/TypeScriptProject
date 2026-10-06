/**
 * Deleting a customer's account, and everything that belongs to it.
 *
 * @remarks
 * Google Play requires an app that lets people sign up to let them delete
 * the account from inside the app, and the published `/delete-account` page
 * promises that a customer's name, email, phone, addresses and lists all go.
 * This is the code that keeps that promise.
 *
 * What is removed: the user record (which carries the name, email, phone,
 * saved addresses and push tokens), every chat message on their lists from
 * either side, the cart, the wishlist, any catalogue order, and finally the
 * sign-in itself at Clerk.
 *
 * What the shop keeps: each grocery list as its sales record - code, items,
 * prices, total, dates, payment state, and the customer's name and mobile
 * number as they were on the order. The shop needs to know whose sale it
 * was, and tax and accounting law requires sales records to be kept; the
 * DPDP Act allows retention a law requires. The email and the order note are
 * cleared. The published policy and delete-account page say exactly this.
 *
 * Two things stop a deletion, and only two:
 *
 * - **A shop account.** An admin or staff member deleting themselves from
 *   the app would leave the shop locked out or the staff roster pointing at
 *   nobody. They are told to ask the owner.
 * - **A paid order not yet collected.** The shop is holding the customer's
 *   money against goods. Deleting would erase the only record of it, and
 *   that record protects the customer as much as the shop. Once it is
 *   collected or refunded, deletion goes through.
 *
 * An open order that is *not* paid does not block anything. It is marked
 * cancelled, and the shop is told on Telegram so nobody packs a bag for a
 * customer who has gone.
 *
 * The data goes first and the sign-in last. If Clerk then fails, the data is
 * already gone and the customer is asked to try again; a retry finds no
 * record, makes an empty one on the way in, and deletes that too.
 *
 * @packageDocumentation
 */
import { clerkClient } from "@clerk/express";
import { Cart } from "../models/Cart";
import { GroceryList } from "../models/GroceryList";
import { Message } from "../models/Message";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { Wishlist } from "../models/Wishlist";
import { AppError } from "../utils/AppError";
import { sendTelegram } from "../utils/telegram";

/** Statuses after which an order is over and nothing is owed either way. */
const FINISHED = ["completed", "cancelled"];


/** The part of a user record this needs. */
export type DeletableUser = {
  _id: unknown;
  clerkUserId?: string | null;
  role?: string | null;
};

/**
 * Deletes `user` and everything tied to them.
 *
 * @throws AppError 409 for a shop account, or while a paid order is still
 * waiting to be collected.
 * @throws AppError 502 when the data is gone but Clerk could not delete the
 * sign-in.
 */
export async function deleteCustomerAccount(user: DeletableUser): Promise<void> {
  if (user.role && user.role !== "user") {
    throw new AppError(
      409,
      "This is a shop account, so it can't be deleted from the app. Ask the shop owner to remove it.",
    );
  }

  const owner = { user: user._id };

  const paidAndWaiting = await GroceryList.exists({
    ...owner,
    paymentStatus: "paid",
    status: { $nin: FINISHED },
  });
  if (paidAndWaiting) {
    throw new AppError(
      409,
      "You have a paid order that hasn't been collected yet. Collect it, or ask the shop for a refund, and then delete your account.",
    );
  }

  const lists: { _id: unknown; status: string }[] = await GroceryList.find(owner)
    .select("_id status")
    .lean();
  const listIds = lists.map((list) => list._id);
  const withdrawn = lists.filter((list) => !FINISHED.includes(list.status));

  await Message.deleteMany({ $or: [owner, { groceryList: { $in: listIds } }] });

  // Open, unpaid orders are called off; every order stays as the shop's
  // sales record, with the name and number on it and the email and note
  // cleared.
  if (withdrawn.length) {
    await GroceryList.updateMany(
      { _id: { $in: withdrawn.map((list) => list._id) } },
      { $set: { status: "cancelled" } },
    );
  }
  await GroceryList.updateMany(owner, {
    $set: { customerEmail: "", note: "" },
  });
  await Cart.deleteMany(owner);
  await Wishlist.deleteMany(owner);
  await Order.deleteMany(owner);
  await User.deleteOne({ _id: user._id });

  if (withdrawn.length) {
    const codes = withdrawn.map((list) => `#${String(list._id).slice(-8).toUpperCase()}`);
    await sendTelegram(
      `🗑️ <b>Order withdrawn</b>\nA customer deleted their account. ` +
        `Please don't pack: ${codes.join(", ")}`,
    );
  }

  if (user.clerkUserId) {
    try {
      await clerkClient.users.deleteUser(user.clerkUserId);
    } catch (err) {
      // Clerk answers 404 for a sign-in that is already gone; that is the
      // outcome we wanted, not a failure.
      const status = (err as { status?: number })?.status;
      if (status !== 404) {
        throw new AppError(
          502,
          "Your data has been deleted, but we couldn't close your login. Please try again.",
        );
      }
    }
  }
}
