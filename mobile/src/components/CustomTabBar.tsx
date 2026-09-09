import { Pressable, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";
import { cn } from "@/lib/utils";

const ACTIVE = "#3c5a64";
const INACTIVE = "#ada291";
const ALERT = "#c0492f";

// A tab bar with a raised circular button in the middle. The four screen tabs
// sit two-and-two on either side, and the centre button opens the grocery list
// sheet rather than navigating anywhere — it is an action, not a destination.
export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const openSheet = useGrocerySheetStore((store) => store.open);

  // Unsent items — badges the centre button so the draft is never forgotten.
  const draftCount = useDraftListStore(
    (store) =>
      store.rows.filter((row) => (row.name ?? "").trim().length > 0).length,
  );

  const renderTab = (routeIndex: number) => {
    const route = state.routes[routeIndex];
    if (!route) return null;

    const { options } = descriptors[route.key];
    const isFocused = state.index === routeIndex;
    const color = isFocused ? ACTIVE : INACTIVE;

    const icon = options.tabBarIcon?.({
      focused: isFocused,
      color,
      size: 22,
    });

    const label =
      typeof options.tabBarLabel === "string"
        ? options.tabBarLabel
        : (options.title ?? route.name);

    const badge = options.tabBarBadge;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={String(label)}
        className="flex-1 items-center justify-center gap-0.5 py-1"
      >
        <View>
          {icon}
          {badge !== undefined && badge !== null ? (
            <View className="absolute -right-2.5 -top-1 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1">
              <Text className="text-[10px] font-bold text-destructive-foreground">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={{ color }}
          className="text-[11px] font-semibold"
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      // overflow must stay visible: the centre button is lifted above the bar
      // with a negative margin and would otherwise be clipped on Android.
      style={{ paddingBottom: insets.bottom + 6, overflow: "visible" }}
      className="flex-row items-end border-t border-border bg-card pt-2"
    >
      {renderTab(0)}
      {renderTab(1)}

      {/* Centre action: opens the grocery list sheet. Sized to the same flex
          slot as a tab so the four tabs stay evenly spaced. */}
      <View className="flex-1 items-center">
        <Pressable
          onPress={openSheet}
          accessibilityRole="button"
          accessibilityLabel={t("home.listTitle")}
          // Lifted above the bar so it reads as a floating action button.
          style={{
            marginTop: -28,
            elevation: 8,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
          className={cn(
            "h-14 w-14 items-center justify-center rounded-full border-4 border-card bg-primary active:opacity-85",
          )}
        >
          <MaterialCommunityIcons
            name="playlist-plus"
            size={26}
            color="#ffffff"
          />
          {draftCount > 0 ? (
            <View className="absolute -right-0.5 -top-0.5 min-w-[18px] items-center justify-center rounded-full border-2 border-card px-1" style={{ backgroundColor: ALERT }}>
              <Text className="text-[10px] font-bold text-white">
                {draftCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {renderTab(2)}
      {renderTab(3)}
    </View>
  );
}
