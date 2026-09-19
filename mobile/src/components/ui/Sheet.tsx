/**
 * The app's single bottom sheet, its error boundary, and the re-exported
 * pieces a sheet's insides are built from.
 *
 * @remarks
 * The ONE sheet in the app: everything that slides up from the bottom - the
 * list paper, the phone prompt, chat, the quantity picker, editing a profile -
 * is this component with different children. One place decides how a sheet
 * looks, how it closes, and how it behaves with the keyboard, so they can
 * never drift apart.
 *
 * The point of it is the thing a plain `<Modal>` cannot do: PULL IT DOWN to
 * close. Before this, a customer had to find the small ✕ or tap the strip of
 * screen above the sheet. The drag runs on the UI thread (gesture-handler +
 * reanimated), so the sheet follows the finger instead of lagging behind it.
 *
 * Why this is hand-written rather than `@gorhom/bottom-sheet`: that library is
 * written for Reanimated 3, and on Reanimated 4 - which Expo SDK 54 requires -
 * its sheets simply never open. We tried it; they didn't. Do not "simplify"
 * this file by reaching for the library.
 *
 * Sheets are drawn through a portal at the app root, so one can sit on top of
 * another (Send inside the list sheet opens the phone prompt) - a `<Modal>`
 * inside a `<Modal>` was unreliable on Android, which is what forced each
 * screen to hand-roll its own sheet before.
 *
 * @packageDocumentation
 */

import {
  Component,
  useCallback,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Portal } from "@gorhom/portal";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SHEET_BACKGROUND = "#F0F4EC"; // background
const SHEET_BORDER = "#e6dcc9"; // border
// Deliberately darker than the old `bg-muted` bar, which was nearly invisible
// against the sand ground: the handle is the app's one hint that a sheet can
// be pulled down, so it has to be seen.
const HANDLE = "#c9bfa9";

const OPEN_MS = 260;
const CLOSE_MS = 200;
// Let go past this far down, or flick faster than this, and the sheet goes.
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 900;

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  // A fixed height, as a share of the screen ("93%"). Leave it out and the
  // sheet is as tall as its content.
  height?: `${number}%`;
  // The content owns its own edges - no side padding, no bottom inset added.
  // For sheets whose insides go right up to the edge: the list paper, a chat
  // with a composer pinned to the bottom.
  bare?: boolean;
  // Space under the content, on top of the phone's own bottom inset.
  bottomPadding?: number;
};

/**
 * A panel that slides up from the bottom of the screen over whatever the
 * customer was looking at, and can be pulled back down to dismiss.
 *
 * @remarks
 * Renders into `<Portal>`, whose host is mounted at the app root inside
 * `NavigationContainer`. That placement is deliberate twice over: it lets one
 * sheet open on top of another, and it lets sheet contents call
 * `useNavigation()` — which they do, since a sheet's insides are ordinary
 * screen code.
 *
 * It stays mounted through the closing slide, so it leaves the screen instead
 * of vanishing. While closed it renders nothing, but it is not free: it still
 * measures the window, reads the safe area and creates shared values. Never
 * put a `<Sheet>` inside a list cell — open a shared one from a store instead.
 *
 * Also owned here: Android's hardware back closes the top sheet; the backdrop
 * fades with the drag; the bottom edge rides on the keyboard; and content that
 * throws is caught by {@link SheetContentGuard} rather than blacking out the
 * app.
 *
 * @param height - A fixed height as a share of the screen. Changes the layout,
 * not just the size: a tall sheet is pinned top and bottom and only its grab
 * bar drags, while a short sheet hugs its content and drags anywhere.
 * @param bare - Removes the side padding and the bottom inset, for content
 * that owns its own edges.
 * @param bottomPadding - Added on top of the phone's bottom inset. Ignored
 * when `bare`.
 */
export function Sheet({
  open,
  onClose,
  children,
  height,
  bare = false,
  bottomPadding = 16,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Kept mounted until the closing slide has finished, so it slides out
  // instead of vanishing.
  const [mounted, setMounted] = useState(false);
  const translateY = useSharedValue(screenHeight);
  const dragStart = useSharedValue(0);
  // How far the keyboard pushes the sheet's bottom edge up.
  const [keyboardLift, setKeyboardLift] = useState(0);

  const unmount = useCallback(() => setMounted(false), []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      translateY.value = withTiming(0, { duration: OPEN_MS });
      return;
    }
    if (!mounted) return;
    translateY.value = withTiming(
      screenHeight,
      { duration: CLOSE_MS },
      (done) => {
        "worklet";
        if (done) runOnJS(unmount)();
      },
    );
  }, [open, mounted, screenHeight, translateY, unmount]);

  // The sheet's bottom edge rides on top of the keyboard, so nothing inside -
  // no line, no button - is ever left under it.
  useEffect(() => {
    if (!mounted) return;
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const show = Keyboard.addListener(showEvent, (event) => {
      const reported = event.endCoordinates?.height ?? 0;
      // React Native on Android reports the keyboard with the navigation bar
      // SUBTRACTED. This edge-to-edge window draws behind the nav bar, so the
      // keyboard actually covers `reported + nav bar`; adding the inset back
      // is exact, and self-correcting (without edge-to-edge it is 0).
      setKeyboardLift(
        Platform.OS === "android" ? reported + insets.bottom : reported,
      );
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardLift(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, [mounted, insets.bottom]);

  // Android's back button closes the top sheet, like every other screen.
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [open, onClose]);

  // Drag down to dismiss. Dragging UP does nothing - the sheet is already as
  // tall as it gets - so the gesture only ever follows the finger downwards.
  // Built fresh for each place it is attached: one Gesture cannot be shared
  // between two detectors.
  const makeDrag = () =>
    Gesture.Pan()
      .onStart(() => {
        "worklet";
        dragStart.value = translateY.value;
      })
      .onUpdate((event) => {
        "worklet";
        translateY.value = Math.max(0, dragStart.value + event.translationY);
      })
      .onEnd((event) => {
        "worklet";
        const far = translateY.value > CLOSE_DISTANCE;
        const flicked = event.velocityY > CLOSE_VELOCITY;
        if (far || flicked) {
          runOnJS(onClose)();
          return;
        }
        // Not far enough: settle back, with a little weight to it.
        translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
      });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // The backdrop fades with the sheet, so a half-dragged sheet shows a
  // half-lit screen behind it - the app feels attached to the finger.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - translateY.value / screenHeight) * 0.5,
  }));

  const contentStyle = {
    flex: height ? 1 : 0,
    paddingHorizontal: bare ? 0 : 20,
    paddingBottom: bare ? 0 : insets.bottom + bottomPadding,
  } as const;

  if (!mounted) return null;

  return (
    <Portal>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="bg-black"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              bottom: keyboardLift,
              // A tall sheet is pinned top AND bottom, so the keyboard takes
              // height off the BOTTOM of it: pinning only the bottom would
              // push its header - and Send - off the top of the screen. A
              // short sheet has no top to pin; it just rides up.
              ...(height
                ? {
                    top:
                      screenHeight - (screenHeight * parseFloat(height)) / 100,
                  }
                : { maxHeight: screenHeight - insets.top - 24 }),
            },
            sheetStyle,
          ]}
        >
          {/* The grab bar, always draggable. */}
          <GestureDetector gesture={makeDrag()}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>

          <SheetContentGuard onClose={onClose}>
            {height ? (
              // A tall sheet scrolls inside itself, so only the grab bar pulls
              // it down - otherwise a scroll and a drag would fight each other.
              <View style={contentStyle}>{children}</View>
            ) : (
              // A short sheet has nothing to scroll, so the whole of it follows
              // the finger. (A pan only starts once the finger MOVES, so taps on
              // the buttons and fields inside still land.)
              <GestureDetector gesture={makeDrag()}>
                <View style={contentStyle}>{children}</View>
              </GestureDetector>
            )}
          </SheetContentGuard>
        </Animated.View>
      </View>
    </Portal>
  );
}

type GuardProps = { children: ReactNode; onClose: () => void };

/**
 * An error boundary around a sheet's contents, showing the failure inside the
 * sheet with a Close button.
 *
 * @remarks
 * A sheet is drawn over the whole app, so an error inside one used to take
 * the app with it: the screen went black and the customer had to kill it from
 * the task switcher. Now the sheet says what went wrong and can be closed,
 * and the app behind it is untouched.
 *
 * The known cause was sheet contents calling `useNavigation()` while the
 * portal host sat outside `NavigationContainer`. The message is shown
 * untranslated on purpose — it is a developer-facing failure string, not copy.
 */
class SheetContentGuard extends Component<GuardProps, { message: string }> {
  state = { message: "" };

  static getDerivedStateFromError(error: unknown) {
    return { message: (error as Error)?.message || "Something went wrong" };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[sheet] content failed to render", error, info);
  }

  render() {
    if (!this.state.message) return this.props.children;

    return (
      <View style={styles.failure}>
        <Text style={styles.failureTitle}>This didn't open properly</Text>
        <Text style={styles.failureBody}>{this.state.message}</Text>
        <Pressable onPress={this.props.onClose} style={styles.failureButton}>
          <Text style={styles.failureButtonText}>Close</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: SHEET_BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: SHEET_BORDER,
    overflow: "hidden",
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
  },
  handleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: HANDLE,
  },
  failure: {
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  failureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2a2e",
  },
  failureBody: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6f6857",
  },
  failureButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#3c5a64",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  failureButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});

// A sheet's insides are ordinary React Native: no special input or list is
// needed. They are re-exported here so a sheet is built out of one import,
// and so the pieces can gain sheet-specific behaviour later without every
// screen changing.
export {
  TextInput as SheetTextInput,
  FlatList as SheetFlatList,
  ScrollView as SheetScrollView,
} from "react-native";
export type {
  FlatList as SheetFlatListRef,
  ScrollView as SheetScrollViewRef,
} from "react-native";
