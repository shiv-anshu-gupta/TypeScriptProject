import { useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { BackHandler, StyleSheet } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The ONE sheet in the app: everything that slides up from the bottom - the
// list paper, the phone prompt, chat, the quantity picker, editing a profile -
// is this component with different children. One place decides how a sheet
// looks, how it closes, and how it behaves with the keyboard, so they can
// never drift apart.
//
// Built on @gorhom/bottom-sheet, which brings the thing we could not get from
// a plain <Modal>: you can DRAG IT DOWN to close. Before this, a customer had
// to find the ✕ or tap the strip of screen above the sheet, which is not how a
// phone is meant to feel. Dragging works because the library runs the gesture
// on the UI thread (react-native-gesture-handler + reanimated, both already in
// the app), so the sheet follows the finger instead of lagging behind it.
//
// Sheets can also sit on top of each other now (Send inside the list sheet
// opens the phone prompt) - a <Modal> inside a <Modal> was unreliable on
// Android, which is what forced the old hand-written sheet.

const SHEET_BACKGROUND = "#F0F4EC"; // background
const SHEET_BORDER = "#e6dcc9"; // border
// Deliberately darker than the old `bg-muted` bar, which was nearly invisible
// against the sand ground: the handle is now the app's one hint that a sheet
// can be pulled down, so it has to be seen.
const HANDLE = "#c9bfa9";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  // Fixed heights, e.g. ["92%"]. Leave it out and the sheet takes the height
  // of its content.
  snapPoints?: (string | number)[];
  // Put the content in a scroller. Needed for anything taller than the sheet
  // (the list paper, a chat) so scrolling inside doesn't drag the sheet down.
  scroll?: boolean;
  // Space under the content, on top of the phone's own bottom inset.
  bottomPadding?: number;
  // The content owns its own edges - no side padding, no bottom inset added.
  // For sheets whose insides go right up to the edge: the list paper, a chat
  // with a composer pinned to the bottom.
  bare?: boolean;
};

export function Sheet({
  open,
  onClose,
  children,
  snapPoints,
  scroll = false,
  bottomPadding = 16,
  bare = false,
}: SheetProps) {
  const sheet = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

  // `open` is the truth; the sheet is told to follow it.
  useEffect(() => {
    if (open) sheet.current?.present();
    else sheet.current?.dismiss();
  }, [open]);

  // Android's back button closes the top sheet, like every other screen.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  // A drag-to-close, a tap on the backdrop and a ✕ all end up here, so the
  // screen that opened the sheet always learns it is shut.
  const handleDismiss = useCallback(() => {
    if (open) onClose();
  }, [open, onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const contentStyle = useMemo(
    () => ({
      paddingHorizontal: bare ? 0 : 20,
      paddingBottom: bare ? 0 : insets.bottom + bottomPadding,
      // At a fixed height the content has to fill the sheet; when the sheet is
      // sized to its content, it must NOT (flex: 1 would collapse it).
      ...(snapPoints ? { flex: 1 } : null),
    }),
    [bare, bottomPadding, insets.bottom, snapPoints],
  );

  const Content = scroll ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={sheet}
      snapPoints={snapPoints}
      // Without snap points the sheet is exactly as tall as what's inside it.
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      // The sheet rides above the keyboard while it is typed in, and settles
      // back when the keypad closes. `adjustResize` is what makes this work on
      // Android now that the window itself no longer resizes (edge-to-edge).
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      {scroll ? (
        <BottomSheetScrollView
          style={styles.scroll}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="always"
        >
          {children}
        </BottomSheetScrollView>
      ) : (
        <BottomSheetView style={contentStyle}>{children}</BottomSheetView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: SHEET_BACKGROUND,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: SHEET_BORDER,
  },
  handle: {
    backgroundColor: HANDLE,
    width: 44,
    height: 5,
  },
  scroll: {
    flex: 1,
  },
});

// Re-exported so a sheet's own text inputs come from the same place as the
// sheet itself. These know they are inside a sheet, so focusing one lifts the
// sheet instead of leaving the field under the keypad.
export { BottomSheetTextInput as SheetTextInput } from "@gorhom/bottom-sheet";

// A list inside a sheet has to be this one: it tells the sheet when the list
// is scrolled to the top, which is what lets a downward drag there close the
// sheet instead of fighting the list.
export { BottomSheetFlatList as SheetFlatList } from "@gorhom/bottom-sheet";
export type { BottomSheetFlatListMethods as SheetFlatListRef } from "@gorhom/bottom-sheet";

// The same for a sheet that scrolls its own content (the list paper), when it
// needs to stay in charge of layout rather than hand it to `scroll`.
export { BottomSheetScrollView as SheetScrollView } from "@gorhom/bottom-sheet";
export type { BottomSheetScrollViewMethods as SheetScrollViewRef } from "@gorhom/bottom-sheet";
