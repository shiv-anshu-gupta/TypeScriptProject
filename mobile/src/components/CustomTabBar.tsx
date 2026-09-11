import { Pressable, Text, useWindowDimensions, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Svg, {
  Defs,
  Path,
  Text as SvgText,
  TextPath,
} from "react-native-svg";

import { CurvedCaption } from "@/components/CurvedCaption";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";

const ACTIVE = "#3c5a64";
const INACTIVE = "#ada291";
const ALERT = "#c0492f";
const CARD = "#ffffff";
const BORDER = "#e6dcc9";
// The app's page ground. The corners either side of the arc are not covered by
// the bar shape, so they must be painted with the same colour the screen above
// uses — otherwise the navigator's own backdrop shows through there.
const BACKGROUND = "#f0f4ec";

// Geometry of the bar. CURVE_RADIUS is both the radius of the arc that sweeps
// up around the button AND how far that arc rises above the bar's flat edge,
// because the arc is a half-circle: it spans 2r horizontally and peaks r above.
const CURVE_RADIUS = 38;
const BAR_HEIGHT = 56; // the flat part, excluding the safe-area inset
const BUTTON_SIZE = 58;

// The caption rides its own arc, concentric with the button, so it bends with
// the curve instead of sitting flat like the other four tab labels.
const CAPTION_OFFSET = 17; // gap from the button's edge to the text
const CAPTION_SIZE = 16.5;
const CAPTION_WORDGAP = 3;
const CAPTION_TRACKING = 1.6;

// Devanagari cannot go through TextPath: it advances one codepoint at a time,
// so the zero-width ि matra and the स्ट conjunct fall apart and ल/स collide,
// and no letter-spacing fixes that (verified on device at 3.2 and 6). It is
// drawn by CurvedCaption instead, which keeps each akshara whole.
const DEVANAGARI = /[ऀ-ॿ]/;
const CAPTION_SIZE_DEVANAGARI = 15; // Devanagari reads larger at the same size
const CAPTION_AKSHARA_GAP = 3; // space between syllables along the arc
const CAPTION_CENTERLINE = 43; // button centre -> middle of each syllable

// A bottom tab bar whose top edge sweeps up and around a large circular button
// in the middle.
//
// The curve is an SVG elliptical-arc command. This cannot be done with
// border-radius: a cradle needs the arc to ease back into the straight edge,
// and a CSS arc always meets that edge at a visible kink. Drawing the whole bar
// as one path also means the outline is continuous, with no seam where the
// curve joins the line.
export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const openSheet = useGrocerySheetStore((store) => store.open);

  // Unsent items — badges the centre button so the draft is never forgotten.
  const draftCount = useDraftListStore(
    (store) =>
      store.rows.filter((row) => (row.name ?? "").trim().length > 0).length,
  );

  const totalHeight = CURVE_RADIUS + BAR_HEIGHT + insets.bottom;
  const curveLeftX = width / 2 - CURVE_RADIUS;
  const curveRightX = width / 2 + CURVE_RADIUS;

  // The filled body of the bar: down the left edge, across to the curve, over
  // the arc (sweep-flag 1 bulges it upward), on to the right edge, then closed.
  const bodyPath = [
    `M0,${totalHeight}`,
    `L0,${CURVE_RADIUS}`,
    `L${curveLeftX},${CURVE_RADIUS}`,
    `A${CURVE_RADIUS},${CURVE_RADIUS} 0 0 1 ${curveRightX},${CURVE_RADIUS}`,
    `L${width},${CURVE_RADIUS}`,
    `L${width},${totalHeight}`,
    "Z",
  ].join(" ");

  // The same top edge again, stroked only, so the hairline border follows the
  // curve. Stroking the body would also outline the sides and the bottom.
  const edgePath = [
    `M0,${CURVE_RADIUS}`,
    `L${curveLeftX},${CURVE_RADIUS}`,
    `A${CURVE_RADIUS},${CURVE_RADIUS} 0 0 1 ${curveRightX},${CURVE_RADIUS}`,
    `L${width},${CURVE_RADIUS}`,
  ].join(" ");

  // The rail the caption runs along: same centre as the button, drawn left to
  // right with sweep-flag 0 so it bulges downward and the letters stay upright.
  const caption = t("tabs.writeList");
  const shapedScript = DEVANAGARI.test(caption);

  const captionRadius = BUTTON_SIZE / 2 + CAPTION_OFFSET;
  const captionPath = [
    `M${width / 2 - captionRadius},${CURVE_RADIUS}`,
    `A${captionRadius},${captionRadius} 0 0 0 ${width / 2 + captionRadius},${CURVE_RADIUS}`,
  ].join(" ");

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
        className="flex-1 items-center justify-center gap-0.5"
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
    <View style={{ height: totalHeight, backgroundColor: BACKGROUND }}>
      {/* The bar itself, drawn as one continuous shape */}
      <Svg
        width={width}
        height={totalHeight}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <Path id="captionArc" d={captionPath} />
        </Defs>
        <Path d={bodyPath} fill={CARD} />
        <Path d={edgePath} fill="none" stroke={BORDER} strokeWidth={1} />
        {shapedScript ? null : (
          <SvgText
            fill={ACTIVE}
            fontSize={CAPTION_SIZE}
            fontWeight="700"
            letterSpacing={CAPTION_TRACKING}
            wordSpacing={CAPTION_WORDGAP}
            textAnchor="middle"
          >
            <TextPath href="#captionArc" startOffset="50%">
              {caption}
            </TextPath>
          </SvgText>
        )}
      </Svg>

      {/* Tabs sit on the flat part, below the curve */}
      <View
        style={{ marginTop: CURVE_RADIUS, height: BAR_HEIGHT }}
        className="flex-row items-center"
      >
        {renderTab(0)}
        {renderTab(1)}
        {/* Empty column: keeps the four tabs evenly spaced around the button */}
        <View className="flex-1" />
        {renderTab(2)}
        {renderTab(3)}
      </View>

      {/* Devanagari caption: whole aksharas placed along the arc. Keyed by the
          text so switching language remounts it and re-measures. */}
      {shapedScript ? (
        <CurvedCaption
          key={caption}
          text={caption}
          cx={width / 2}
          cy={CURVE_RADIUS}
          radius={CAPTION_CENTERLINE}
          fontSize={CAPTION_SIZE_DEVANAGARI}
          color={ACTIVE}
          gap={CAPTION_AKSHARA_GAP}
          wordGap={CAPTION_WORDGAP}
        />
      ) : null}

      {/* The button, centred on the arc so the curve wraps it evenly */}
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={t("home.listTitle")}
        style={{
          position: "absolute",
          top: CURVE_RADIUS - BUTTON_SIZE / 2,
          left: width / 2 - BUTTON_SIZE / 2,
          height: BUTTON_SIZE,
          width: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          elevation: 6,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
        }}
        className="items-center justify-center bg-primary active:opacity-85"
      >
        <MaterialCommunityIcons
          name="playlist-plus"
          size={27}
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
