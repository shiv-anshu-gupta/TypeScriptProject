import type { NavigatorScreenParams } from "@react-navigation/native";

export type TabParamList = {
  Home: undefined;
  // `search` is a one-shot hand-off from the Home search bar: Shop applies it,
  // then clears it so the same term can be searched again later.
  Shop: { category?: string; search?: string } | undefined;
  Lists: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: { productId: string };
  Wishlist: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Legal: undefined;
};
