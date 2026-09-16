import type { NavigatorScreenParams } from "@react-navigation/native";

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

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: { productId: string };
  Wishlist: undefined;
  SignIn: undefined;
  Legal: undefined;
};
