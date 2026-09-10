import { Pressable, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";

const ACTIVE = "#3c5a64";
const INACTIVE = "#ada291";
const ALERT = "#c0492f";
const CARD = "#ffffff";
const BORDER = "#e6dcc9";

// The raised centre button, and the curve the bar's top edge makes around it.
// The button is absolutely positioned against the bar, so this offset is
// exact: `top: 0` is the top of the wrapper, RISE px above the bar itself.
const BUTTON_SIZE = 68; // includes the 4px ring
const BUTTON_RISE = 30; // roughly half the button sits above the bar

// A tab bar with a large circular button raised over the middle of it.
//
// There is deliberately no curve cut into the bar: border-radius cannot make
// the reverse S-curves a real cradle needs, so an arc built that way meets the
// straight border at a visible kink. A clean straight bar with a ringed
// floating button reads far better. A true cradle needs react-native-svg,
// which is a native module and cannot ship over the air.
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
    // Outer wrapper reserves space above the bar so the button sits INSIDE its
    // bounds. On Android a child positioned outside its parent is not tappable,
    // so this is what keeps the whole button pressable rather than just the
    // half overlapping the bar.
    <View style={{ paddingTop: BUTTON_RISE, backgroundColor: "transparent" }}>
      <View
        style={{
          paddingBottom: insets.bottom + 6,
          backgroundColor: CARD,
          borderTopWidth: 1,
          borderTopColor: BORDER,
        }}
        className="flex-row items-end pt-2"
      >
        {renderTab(0)}
        {renderTab(1)}
        {/* Empty column: keeps the four tabs evenly spaced around the button */}
        <View className="flex-1" />
        {renderTab(2)}
        {renderTab(3)}
      </View>

      {/* The raised button. The card-coloured ring separates it from the bar
          so it reads as floating on top rather than cut into it. */}
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={t("home.listTitle")}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          marginLeft: -BUTTON_SIZE / 2,
          height: BUTTON_SIZE,
          width: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          borderWidth: 4,
          borderColor: CARD,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
        className="items-center justify-center bg-primary active:opacity-85"
      >
        <MaterialCommunityIcons
          name="playlist-plus"
          size={30}
          color="#ffffff"
        />
        {draftCount > 0 ? (
          <View
            className="absolute right-0 top-0 min-w-[20px] items-center justify-center rounded-full px-1"
            style={{
              backgroundColor: ALERT,
              borderWidth: 2,
              borderColor: CARD,
            }}
          >
            <Text className="text-[10px] font-bold text-white">
              {draftCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
