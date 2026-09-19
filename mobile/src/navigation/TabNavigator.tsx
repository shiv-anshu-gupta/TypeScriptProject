/**
 * The bottom tab navigator: Home, Shop, Lists and Account.
 *
 * @packageDocumentation
 */

import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { TabParamList } from "./types";
import { HomeScreen } from "@/screens/HomeScreen";
import { ShopScreen } from "@/screens/ShopScreen";
import { AccountScreen } from "@/screens/AccountScreen";
import { MyListsScreen } from "@/screens/MyListsScreen";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import {
  countSendableRows,
  useDraftListStore,
} from "@/features/customer/draft-list/store";
import { CustomTabBar } from "@/components/CustomTabBar";

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

/**
 * A tab icon that beats gently while there is something waiting for the
 * customer.
 *
 * @remarks
 * Heartbeat-pulsing icon: grabs attention while the draft is waiting to be
 * sent, so even first-time / less-literate users notice where to go next.
 *
 * The loop is stopped on unmount and whenever `pulse` goes false, so a settled
 * tab bar runs no animation at all. It uses the native driver, so the beat
 * does not stutter while the customer scrolls.
 *
 * @param pulse - Turns the beat on. False also resets the scale to 1 straight away.
 */
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

/**
 * The four bottom tabs, drawn by the app's own tab bar rather than the
 * default one.
 *
 * @remarks
 * Subscribes to two stores so the Lists tab can advertise itself: the unseen
 * count of sent orders, and the number of sendable rows in the unsent draft.
 * The badge shows unseen orders first and falls back to the draft count, since
 * news from the shop matters more than a reminder to send. A non-empty draft
 * also turns the icon red and starts it beating.
 *
 * `freezeOnBlur` means a tab that is off screen stops re-rendering but stays
 * mounted, so its effects still run. That is why several screens guard their
 * work with `useIsFocused()` — a background tab must not mark orders seen or
 * take over the device's single Clerk sign-in attempt.
 *
 * The bar itself is {@link CustomTabBar}, which handles its own safe-area
 * padding and owns the raised centre button that opens the list sheet. That
 * button is not a tab and has no route.
 */
export function TabNavigator() {
  const { t } = useTranslation();
  const unseenLists = useCustomerGroceryListStore((state) => state.unseenCount);
  // Unsent draft items — badged + heartbeat on Lists so the customer
  // remembers the draft still has to be SENT from there.
  const draftCount = useDraftListStore((state) =>
    countSendableRows(state.rows),
  );

  const listsBadge =
    unseenLists > 0 ? unseenLists : draftCount > 0 ? draftCount : undefined;

  return (
    <Tab.Navigator
      // Custom bar so a raised circular button can sit in the middle; it
      // handles its own safe-area padding.
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        // A tab that isn't on screen stops re-rendering; it wakes up with the
        // latest data when the customer comes back to it.
        freezeOnBlur: true,
        headerShown: false,
        tabBarLabel: t(`tabs.${route.name.toLowerCase()}`),
        tabBarActiveTintColor: "#3c5a64",
        tabBarInactiveTintColor: "#ada291",
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
