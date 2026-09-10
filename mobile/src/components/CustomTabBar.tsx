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
// Both are absolutely positioned against the bar, so these offsets are exact:
// `top: -RISE` measures straight up from the bar's top border.
const BUTTON_SIZE = 64;
const BUTTON_RISE = 20; // how far the button pokes above the bar
const DOME_WIDTH = 116;
const DOME_HEIGHT = 58;
const DOME_RISE = 24; // 4px clear of the button, so the curve wraps it

// A tab bar with a large circular button in the middle. The bar's top edge
// arcs up over it: the "dome" is an opaque card-coloured shape with only a top
// border, so its curved outline continues the bar's straight border line and
// its fill hides the straight line underneath. Done with border-radius rather
// than SVG on purpose - react-native-svg is a native module, which would make
// this change impossible to ship over the air.
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
    // Outer wrapper reserves DOME_RISE of transparent space above the bar, so
    // the dome and button sit INSIDE its bounds. On Android a child positioned
    // outside its parent is not tappable, so this is what keeps the whole
    // button pressable rather than just the half overlapping the bar.
    <View style={{ paddingTop: DOME_RISE, backgroundColor: "transparent" }}>
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

      {/* The upward curve in the bar's top line. Opaque fill hides the straight
          border beneath it; the rounded top border becomes the arc. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          marginLeft: -DOME_WIDTH / 2,
          width: DOME_WIDTH,
          height: DOME_HEIGHT,
          borderTopLeftRadius: DOME_WIDTH / 2,
          borderTopRightRadius: DOME_WIDTH / 2,
          backgroundColor: CARD,
          borderTopWidth: 1,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: BORDER,
        }}
      />

      {/* The raised button, sitting in the curve */}
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={t("home.listTitle")}
        style={{
          position: "absolute",
          top: DOME_RISE - BUTTON_RISE,
          left: "50%",
          marginLeft: -BUTTON_SIZE / 2,
          height: BUTTON_SIZE,
          width: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.25,
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
