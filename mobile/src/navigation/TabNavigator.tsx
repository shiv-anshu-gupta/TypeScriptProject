import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TabParamList } from "./types";
import { HomeScreen } from "@/screens/HomeScreen";
import { ShopScreen } from "@/screens/ShopScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { MyListsScreen } from "@/screens/MyListsScreen";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { useDraftListStore } from "@/features/customer/draft-list/store";

const Tab = createBottomTabNavigator<TabParamList>();

// Richer, more object-like icons (MaterialCommunityIcons). The Lists tab uses a
// real spiral "notebook" — the grocery pad is the heart of the app.
const iconByRoute: Record<
  keyof TabParamList,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  Home: "home-variant",
  Shop: "storefront",
  Lists: "notebook",
  Account: "account",
};

// Heartbeat-pulsing icon: grabs attention while the draft is waiting to be
// sent, so even first-time / less-literate users notice where to go next.
function PulsingIcon({
  name,
  color,
  size,
  pulse,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size: number;
  pulse: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse) {
      scale.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.35,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.delay(400),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulse, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Animated.View>
  );
}

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const unseenLists = useCustomerGroceryListStore(
    (state) => state.unseenCount,
  );
  // Unsent draft items — badged + heartbeat on Lists so the customer
  // remembers the draft still has to be SENT from there.
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
        tabBarActiveTintColor: "#3c5a64",
        tabBarInactiveTintColor: "#ada291",
        // Reserve the bottom safe-area inset so the bar stays above the
        // Android system nav (edge-to-edge is on by default in RN 0.81).
        tabBarStyle: {
          borderTopColor: "#e6dcc9",
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, size }) =>
          route.name === "Lists" ? (
            <PulsingIcon
              name={iconByRoute[route.name]}
              size={size ?? 22}
              color={draftCount > 0 ? "#c0492f" : color}
              pulse={draftCount > 0}
            />
          ) : (
            <MaterialCommunityIcons
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
