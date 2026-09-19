/**
 * Types for admin promo codes.
 *
 * @remarks
 * Two shapes exist on purpose: `Promo` is what the server returns, with real
 * numbers, and `PromoFormValues` is what the dialog collects, with every field
 * a string. The form values are sent as-is; the server parses them.
 *
 * @packageDocumentation
 */

/**
 * One promo code as the server stores it.
 *
 * @remarks
 * `percentage` is a whole-number discount percentage, `count` the number of
 * redemptions allowed and `minimumOrderValue` a rupee threshold.
 * `startsAt` / `endsAt` are ISO strings. `createdAt` is optional because
 * nothing in this app relies on it.
 */
export type Promo = {
  _id: string;
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: string;
  endsAt: string;
  createdAt?: string;
};

/**
 * Payload of every promo endpoint.
 *
 * @remarks
 * Read, create, update and delete all answer with the same shape — the full
 * list after the change — so the hook can replace its state from any of them.
 */
export type AdminPromosResponse = {
  items: Promo[];
};

/**
 * The promo dialog's form state, and the request body sent to the server.
 *
 * @remarks
 * Every field is a string because it comes straight from an `<input>`:
 * `percentage`, `count` and `minimumOrderValue` are numeric text, `startsAt`
 * and `endsAt` are ISO strings converted from `datetime-local` on submit.
 */
export type PromoFormValues = {
  code: string;
  percentage: string;
  count: string;
  minimumOrderValue: string;
  startsAt: string;
  endsAt: string;
};
