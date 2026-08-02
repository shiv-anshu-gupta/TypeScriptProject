import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { TabNavigator } from "./TabNavigator";
import { ProductDetailsScreen } from "@/screens/ProductDetailsScreen";
import { WishlistScreen } from "@/screens/WishlistScreen";
import { SignInScreen } from "@/screens/SignInScreen";
import { SignUpScreen } from "@/screens/SignUpScreen";
import { LegalScreen } from "@/screens/LegalScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
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
        options={{ title: "Saved products" }}
      />
      <Stack.Screen
        name="SignIn"
        component={SignInScreen}
        options={{ title: "Sign in", presentation: "modal" }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: "Create account", presentation: "modal" }}
      />
      <Stack.Screen
        name="Legal"
        component={LegalScreen}
        options={{ title: "Privacy & Terms" }}
      />
    </Stack.Navigator>
  );
}
