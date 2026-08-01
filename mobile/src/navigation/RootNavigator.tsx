import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { TabNavigator } from "./TabNavigator";
import { ProductDetailsScreen } from "@/screens/ProductDetailsScreen";
import { WishlistScreen } from "@/screens/WishlistScreen";
import { OrdersScreen } from "@/screens/OrdersScreen";
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
        headerTintColor: "#18181b",
        headerTitleStyle: { fontWeight: "600" },
        contentStyle: { backgroundColor: "#ffffff" },
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
        options={{ title: "Wishlist" }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: "My Orders" }}
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
