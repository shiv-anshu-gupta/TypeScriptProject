import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The on-screen keyboard's height, or 0 while it's closed.
//
// On Android (edge-to-edge) the window doesn't shrink for the keyboard, so a
// screen that must keep a field visible pads its own bottom by this. RN
// reports that height minus the navigation bar, hence adding the inset back.
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
