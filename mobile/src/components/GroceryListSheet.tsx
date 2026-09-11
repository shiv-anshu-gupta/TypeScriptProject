import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import {
  GroceryListEditor,
  PAPER_HEADER_HEIGHT,
  ROW_HEIGHT,
} from "@/components/GroceryListEditor";
import { SendListButton } from "@/components/SendListButton";

const SCROLL_PAD_TOP = 12; // space above the paper inside the scroll area
const FOCUS_MARGIN = 20; // keep the line being typed in this far from the edges

// The list sheet, opened by "Write list" and the centre tab button.
//
// Keyboard handling is the heart of it. Android edge-to-edge (the RN 0.81
// default) no longer resizes the window for the keyboard, so a sheet pinned to
// the bottom of the screen simply sits behind it. Here the sheet's TOP stays
// put and its BOTTOM EDGE rides on top of the keyboard, so nothing - no line,
// no button - is ever hidden under it. Send lives in the pinned header, always
// in reach; the lines scroll in between, the keyboard stays open while they
// scroll, and the line being typed in is kept on screen.
//
// Deliberately NOT a <Modal>: Send can open the phone prompt, itself a Modal,
// and a Modal inside a Modal is unreliable on Android.
export function GroceryListSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const isOpen = useGrocerySheetStore((state) => state.isOpen);
  const close = useGrocerySheetStore((state) => state.close);
  const ensureRows = useDraftListStore((state) => state.ensureRows);
  const itemCount = useDraftListStore(
    (state) =>
      state.rows.filter((row) => (row.name ?? "").trim().length > 0).length,
  );

  // Kept mounted until the closing slide has finished.
  const [mounted, setMounted] = useState(false);
  const slide = useRef(new Animated.Value(screenHeight)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  // How far the keyboard pushes the sheet's bottom edge up.
  const keyboardLift = useRef(new Animated.Value(0)).current;
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // Same flag for layout callbacks, which must not read a stale render value.
  const keyboardOpenRef = useRef(false);

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);
  const focusedIndex = useRef<number | null>(null);

  // Scroll just enough to bring line `index` inside the visible area. Row
  // positions are exact (fixed heights), so no measuring is needed.
  const ensureVisible = useCallback((index: number, animated: boolean) => {
    const viewport = viewportHeight.current;
    if (!viewport) return;
    const rowTop = SCROLL_PAD_TOP + PAPER_HEADER_HEIGHT + index * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;
    const top = scrollY.current;

    if (rowBottom + FOCUS_MARGIN > top + viewport) {
      scrollRef.current?.scrollTo({
        y: rowBottom + FOCUS_MARGIN - viewport,
        animated,
      });
    } else if (rowTop - FOCUS_MARGIN < top) {
      scrollRef.current?.scrollTo({
        y: Math.max(0, rowTop - FOCUS_MARGIN),
        animated,
      });
    }
  }, []);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOpen(true);
      keyboardOpenRef.current = true;
      Animated.timing(keyboardLift, {
        toValue: event.endCoordinates?.height ?? 0,
        duration: event.duration || 180,
        useNativeDriver: false, // animates a layout prop
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      setKeyboardOpen(false);
      keyboardOpenRef.current = false;
      focusedIndex.current = null;
      Animated.timing(keyboardLift, {
        toValue: 0,
        duration: event.duration || 180,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardLift]);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(slide, {
        toValue: screenHeight,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [isOpen, slide, backdrop, screenHeight]);

  // Android back closes the sheet. (With the keyboard up, the first back press
  // is taken by the keyboard itself, which is the expected behaviour.)
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, close]);

  if (!mounted) return null;

  const sheetTop = Math.max(insets.top + 12, Math.round(screenHeight * 0.07));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dimmed backdrop — tapping it closes the sheet */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          className="bg-black/50"
        />
      </Animated.View>

      {/* Layout frame: fixed top, bottom edge riding on the keyboard. It is
          JS-animated (bottom is a layout prop), so the native-driven slide
          lives on the inner view - one Animated view can't mix drivers. */}
      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: sheetTop,
          bottom: keyboardLift,
        }}
      >
        <Animated.View
          style={{
            flex: 1,
            transform: [{ translateY: slide }],
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            elevation: 16,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
          }}
          className="overflow-hidden bg-background"
        >
          {/* Grab handle */}
          <View className="items-center pt-2.5">
            <View className="h-1.5 w-12 rounded-full bg-muted" />
          </View>

          {/* Pinned header: close on the left, Send on the right - the
              familiar compose layout - so Send is never out of reach. */}
          <View className="flex-row items-center gap-3 border-b border-border/60 px-4 pb-3 pt-2">
            <Pressable
              onPress={close}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              className="h-9 w-9 items-center justify-center rounded-full bg-secondary"
            >
              <Feather name="x" size={17} color="#1f2a2e" />
            </Pressable>

            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="text-lg font-bold text-foreground"
              >
                {t("home.myList")}
              </Text>
              <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {itemCount
                  ? `${t("home.itemCount", { count: itemCount })} · ${t("home.noLimit")}`
                  : t("home.writeHint")}
              </Text>
            </View>

            <SendListButton variant="pill" />
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            // The keyboard stays up: no tap and no scroll inside the list
            // closes it, so writing the next line is always one tap away.
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={(event) => {
              scrollY.current = event.nativeEvent.contentOffset.y;
            }}
            onLayout={(event) => {
              const viewport = event.nativeEvent.layout.height;
              viewportHeight.current = viewport;
              // Fill the page with lines, so there is never empty space under
              // the list. Measured at full height (keyboard down) - the
              // tallest the page gets.
              if (!keyboardOpenRef.current) {
                ensureRows(
                  Math.ceil(
                    (viewport - SCROLL_PAD_TOP - PAPER_HEADER_HEIGHT) /
                      ROW_HEIGHT,
                  ),
                );
              }
              // The viewport shrinks as the keyboard lifts the sheet; keep the
              // line being typed in on screen while it does.
              if (focusedIndex.current !== null) {
                ensureVisible(focusedIndex.current, false);
              }
            }}
            contentContainerStyle={{
              paddingTop: SCROLL_PAD_TOP,
              paddingBottom: keyboardOpen ? 16 : insets.bottom + 20,
            }}
          >
            <GroceryListEditor
              autoFocusOnOpen
              onRowFocus={(index) => {
                focusedIndex.current = index;
                ensureVisible(index, true);
              }}
            />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
