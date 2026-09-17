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
import {
  countSendableRows,
  useDraftListStore,
} from "@/features/customer/draft-list/store";
import {
  GroceryListEditor,
  PAPER_HEADER_HEIGHT,
  ROW_HEIGHT,
} from "@/components/GroceryListEditor";
import { SendListButton } from "@/components/SendListButton";
import { ScanListPhoto } from "@/components/ScanListPhoto";

const SCROLL_PAD_TOP = 12; // space above the paper inside the scroll area
const FOCUS_MARGIN = 20; // keep the line being typed in this far from the edges

// Who keeps the focused line on screen. On Android the native ScrollView
// already does it, instantly and with exact geometry: requestChildFocus()
// scrolls a newly focused field into view, and onSizeChanged() keeps it in
// view when the ScrollView shrinks for the keyboard. Doing it again from JS
// made two scrollers fight - different margins, a throttled (stale) scroll
// offset - and the list jumped on its own. So JS does it only on iOS, where
// nothing native does.
const SCROLL_FOCUSED_LINE_FROM_JS = Platform.OS === "ios";

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
  const itemCount = useDraftListStore((state) => countSendableRows(state.rows));

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

  // Read inside the keyboard listeners, which are registered once.
  const bottomInsetRef = useRef(insets.bottom);
  bottomInsetRef.current = insets.bottom;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    // Move the sheet's bottom edge. Android reports the keyboard only once it
    // has finished opening, so a JS slide there just trails behind it - and
    // resizes the ScrollView on every frame, each time kicking its native
    // keep-focused-in-view logic. One step is both faster and calmer. iOS
    // announces the keyboard beforehand with its duration, so it can match.
    const moveTo = (lift: number, duration?: number) => {
      if (Platform.OS === "android") {
        keyboardLift.setValue(lift);
        return;
      }
      Animated.timing(keyboardLift, {
        toValue: lift,
        duration: duration || 250,
        useNativeDriver: false, // animates a layout prop
      }).start();
    };

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardOpen(true);
      keyboardOpenRef.current = true;
      const reported = event.endCoordinates?.height ?? 0;
      // React Native on Android reports the keyboard with the navigation bar
      // SUBTRACTED (ReactRootView: imeInsets.bottom - barInsets.bottom). This
      // edge-to-edge window draws behind the nav bar, so the keyboard actually
      // covers `reported + nav bar` - lifting by `reported` alone left the
      // last line behind the keyboard. Adding the bottom inset back is exact,
      // and self-correcting: without edge-to-edge that inset is 0.
      const lift =
        Platform.OS === "android"
          ? reported + bottomInsetRef.current
          : reported;
      moveTo(lift, event.duration);
    });
    const hideSub = Keyboard.addListener(hideEvent, (event) => {
      setKeyboardOpen(false);
      keyboardOpenRef.current = false;
      focusedIndex.current = null;
      moveTo(0, event.duration);
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

          {/* Photograph the paper instead of typing it out - right under the
              header, where it is seen before the first line is written. */}
          <View className="border-b border-border/60 py-3">
            <ScanListPhoto />
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            // The keyboard stays up: no tap and no scroll inside the list
            // closes it, so writing the next line is always one tap away.
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
            // The scroll offset only feeds the JS scroll-into-view, so it is
            // tracked only where that runs - Android scrolls with no JS work.
            scrollEventThrottle={SCROLL_FOCUSED_LINE_FROM_JS ? 32 : undefined}
            onScroll={
              SCROLL_FOCUSED_LINE_FROM_JS
                ? (event) => {
                    scrollY.current = event.nativeEvent.contentOffset.y;
                  }
                : undefined
            }
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
              // line being typed in on screen while it does. (Android's
              // ScrollView does this natively - see SCROLL_FOCUSED_LINE_FROM_JS.)
              if (
                SCROLL_FOCUSED_LINE_FROM_JS &&
                focusedIndex.current !== null
              ) {
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
              onRowFocus={
                SCROLL_FOCUSED_LINE_FROM_JS
                  ? (index) => {
                      focusedIndex.current = index;
                      ensureVisible(index, true);
                    }
                  : undefined
              }
            />
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
