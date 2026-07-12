import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TabParamList } from "./types";
import { HomeScreen } from "@/screens/HomeScreen";
import { ShopScreen } from "@/screens/ShopScreen";
import { CartScreen } from "@/screens/CartScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { MyListsScreen } from "@/screens/MyListsScreen";
import { useCustomerCartAndCheckoutStore } from "@/features/customer/cart-and-checkout/store";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";

const Tab = createBottomTabNavigator<TabParamList>();

const iconByRoute: Record<keyof TabParamList, keyof typeof Feather.glyphMap> = {
  Home: "home",
  Shop: "grid",
  Lists: "clipboard",
  Cart: "shopping-bag",
  Account: "user",
};

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const cartCount = useCustomerCartAndCheckoutStore(
    (state) => state.cart.totalQuantity,
  );
  const unseenLists = useCustomerGroceryListStore(
    (state) => state.unseenCount,
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#18181b",
        tabBarInactiveTintColor: "#a1a1aa",
        // Reserve the bottom safe-area inset so the bar stays above the
        // Android system nav (edge-to-edge is on by default in RN 0.81).
        tabBarStyle: {
          borderTopColor: "#e4e4e7",
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) => (
          <Feather
            name={iconByRoute[route.name]}
            size={size ?? 22}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen
        name="Lists"
        component={MyListsScreen}
        options={{
          tabBarBadge: unseenLists > 0 ? unseenLists : undefined,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
