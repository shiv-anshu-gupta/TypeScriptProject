/**
 * How much of the screen the on-screen keyboard is covering.
 *
 * @packageDocumentation
 */

import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The on-screen keyboard's height, or 0 while it's closed.
 *
 * @remarks
 * On Android (edge-to-edge) the window doesn't shrink for the keyboard, so a
 * screen that must keep a field visible pads its own bottom by this. RN
 * reports that height minus the navigation bar, hence adding the inset back.
 * The correction is self-cancelling: without edge-to-edge the inset is 0.
 *
 * iOS uses the `will` events so padding animates with the keyboard; Android
 * only fires the `did` events reliably, so it moves in one step.
 *
 * Re-renders the calling component on every keyboard change, so call it in
 * the component that does the padding, not in a common ancestor.
 */
export function useKeyboardHeight() {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (event) =>
        setHeight(event.endCoordinates.height + (ios ? 0 : insets.bottom)),
    );
    const hide = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);
  return height;
}
