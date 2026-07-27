import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TabParamList } from "./types";
import { HomeScreen } from "@/screens/HomeScreen";
import { ShopScreen } from "@/screens/ShopScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { MyListsScreen } from "@/screens/MyListsScreen";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { useDraftListStore } from "@/features/customer/draft-list/store";

const Tab = createBottomTabNavigator<TabParamList>();

const iconByRoute: Record<keyof TabParamList, keyof typeof Feather.glyphMap> = {
  Home: "home",
  Shop: "search",
  Lists: "clipboard",
  Account: "user",
};

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const unseenLists = useCustomerGroceryListStore(
    (state) => state.unseenCount,
  );
  // Unsent draft items — badged on Lists so the customer remembers the
  // draft still has to be SENT from there.
  const draftCount = useDraftListStore(
    (state) =>
      state.rows.filter((row) => (row.name ?? "").trim().length > 0).length,
  );

  const listsBadge =
    unseenLists > 0 ? unseenLists : draftCount > 0 ? draftCount : undefined;

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
          tabBarBadge: listsBadge,
        }}
      />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
