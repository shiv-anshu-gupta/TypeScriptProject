import type { NavigatorScreenParams } from "@react-navigation/native";

export type TabParamList = {
  Home: undefined;
  // One-shot hand-offs from Home, each cleared by Shop once applied so the
  // same shortcut works again: `category` shows that category; `openSearch`
  // opens the search field focused, with the keyboard up.
  Shop: { category?: string; openSearch?: boolean } | undefined;
  Lists: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: { productId: string };
  Wishlist: undefined;
  SignIn: undefined;
  Legal: undefined;
};
