import type { NavigatorScreenParams } from "@react-navigation/native";

export type TabParamList = {
  Home: undefined;
  Shop: { category?: string } | undefined;
  Lists: undefined;
  Cart: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductDetails: { productId: string };
  Wishlist: undefined;
  Orders: undefined;
  SignIn: undefined;
  SignUp: undefined;
};
