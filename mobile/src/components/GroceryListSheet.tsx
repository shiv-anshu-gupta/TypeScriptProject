import { useCallback, useEffect, useRef } from "react";
import { Keyboard, Platform, Pressable, Text, View } from "react-native";
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
import {
  Sheet,
  SheetScrollView,
  type SheetScrollViewRef,
} from "@/components/ui/Sheet";

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

// Nearly full screen: the point of this sheet is to be a sheet of paper.
const SHEET_HEIGHT = "93%";

// The list sheet, opened by "Write list" and the centre tab button.
//
// It is the shared <Sheet> now, so it is dragged down to close like every
// other sheet, and the keyboard is handled there - it used to be ~120 lines
// here, because Android edge-to-edge (the RN 0.81 default) no longer resizes
// the window for the keypad. What stays here is only what is specific to
// writing a list: Send pinned in the header, the paper filling the page with
// blank lines, and keeping the line being typed in on screen.
export function GroceryListSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isOpen = useGrocerySheetStore((state) => state.isOpen);
  const close = useGrocerySheetStore((state) => state.close);
  const ensureRows = useDraftListStore((state) => state.ensureRows);
  const itemCount = useDraftListStore((state) => countSendableRows(state.rows));

  const scrollRef = useRef<SheetScrollViewRef>(null);
  const scrollY = useRef(0);
  const viewportHeight = useRef(0);
  const focusedIndex = useRef<number | null>(null);

  // The page is filled with blank lines only while the keyboard is down -
  // that is when the paper is at its tallest.
  const keyboardOpen = useRef(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => {
      keyboardOpen.current = true;
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardOpen.current = false;
      focusedIndex.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Put the keyboard away as the sheet leaves, however it was closed - the ✕,
  // the backdrop, a drag down, or the back button.
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    close();
  }, [close]);

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

  return (
    <Sheet open={isOpen} onClose={handleClose} height={SHEET_HEIGHT} bare>
      <View style={{ flex: 1 }}>
        {/* Pinned header: close on the left, Send on the right - the familiar
            compose layout - so Send is never out of reach. */}
        <View className="flex-row items-center gap-3 border-b border-border/60 px-4 pb-3">
          <Pressable
            onPress={handleClose}
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

        <SheetScrollView
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
            if (!keyboardOpen.current) {
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
            if (SCROLL_FOCUSED_LINE_FROM_JS && focusedIndex.current !== null) {
              ensureVisible(focusedIndex.current, false);
            }
          }}
          contentContainerStyle={{
            paddingTop: SCROLL_PAD_TOP,
            paddingBottom: insets.bottom + 20,
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
        </SheetScrollView>
      </View>
    </Sheet>
  );
}
