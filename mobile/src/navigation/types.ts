/**
 * Route names and their parameters for both navigators.
 *
 * @remarks
 * These two types are what makes `navigate()` and `route.params` type-safe
 * across the app, so a renamed route or a changed parameter surfaces as a
 * TypeScript error rather than a dead tap.
 *
 * @packageDocumentation
 */

import type { NavigatorScreenParams } from "@react-navigation/native";

/**
 * The four bottom tabs and the parameters each accepts.
 *
 * @remarks
 * Parameters here are one-shot hand-offs, not state: the receiving screen
 * clears its own parameter once it has applied it, so tapping the same
 * shortcut on Home twice in a row works both times.
 */
export type TabParamList = {
  Home: undefined;
  // One-shot hand-offs from Home, each cleared by Shop once applied so the
  // same shortcut works again: `category` shows that category; `openSearch`
  // opens the search field focused, with the keyboard up.
  Shop:
    | { category?: string; openSearch?: boolean; browseAll?: boolean }
    | undefined;
  // `tab` opens Lists on a given status tab: pointing at an order is no use
  // if the screen is still filtered to Completed from an earlier visit.
  Lists: { tab?: "active" | "completed" | "cancelled" } | undefined;
  Account: undefined;
};

/**
 * The native stack: the tab host plus the screens that sit over it.
 *
 * @remarks
 * `ProductDetails` can be pushed on top of itself, because a related product
 * opens as a new page rather than replacing the current one.
 *
 * @see {@link TabParamList} for the screens inside `Tabs`.
 */
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: { productId: string };
  Wishlist: undefined;
  SignIn: undefined;
  Legal: undefined;
};
