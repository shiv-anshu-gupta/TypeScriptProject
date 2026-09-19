/**
 * The app's top-level native stack.
 *
 * @packageDocumentation
 */

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import type { RootStackParamList } from "./types";
import { TabNavigator } from "./TabNavigator";
import { ProductDetailsScreen } from "@/screens/ProductDetailsScreen";
import { WishlistScreen } from "@/screens/WishlistScreen";
import { AuthScreen } from "@/screens/AuthScreen";
import { LegalScreen } from "@/screens/LegalScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * The navigator the customer is always inside: the tab bar, with product
 * details, saved products, sign-in and the legal text pushed over it.
 *
 * @remarks
 * There is no route guard here. Every route is reachable signed out; the Lists
 * and Account screens decide for themselves to draw the login in place of
 * their content.
 *
 * Header titles are read through `useTranslation`, so this component
 * re-renders — and the titles change — when the language does.
 *
 * The bottom sheets are not screens and are not listed here. They are
 * portalled in from the app root and draw over whatever this navigator shows.
 *
 * @see {@link RootStackParamList} for the route parameters.
 */
export function RootNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackButtonDisplayMode: "minimal",
        headerTintColor: "#1f2a2e",
        headerTitleStyle: { fontWeight: "600" },
        headerStyle: { backgroundColor: "#f6f1e8" },
        contentStyle: { backgroundColor: "#f6f1e8" },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: "" }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ title: t("account.savedProducts") }}
      />
      {/* One screen for both logging in and creating an account - it draws
          its own close/back bar, so no stack header. */}
      <Stack.Screen
        name="SignIn"
        component={AuthScreen}
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="Legal"
        component={LegalScreen}
        options={{ title: t("account.privacyTerms") }}
      />
    </Stack.Navigator>
  );
}
