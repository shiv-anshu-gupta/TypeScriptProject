import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useKeyboardHeight } from "@/lib/use-keyboard-height";
import { AuthPanel } from "./AuthPanel";

type AuthViewProps = {
  onDone: () => void;
  // Above the panel: a close bar, or a tab's title.
  header?: ReactNode;
  // Below the panel (e.g. settings). Hidden while typing so the field in use
  // stays in view.
  footer?: ReactNode;
  subtitle?: string;
};

// A scrolling page around the login panel that keeps whatever is being typed
// above the keyboard - used as a full screen and inside the tabs.
export function AuthView({ onDone, header, footer, subtitle }: AuthViewProps) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();
  const frameRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  // How far the bottom of this view sits above the bottom of the screen. In a
  // tab it is the tab bar's height; on the full-screen login it is 0.
  const [gapBelow, setGapBelow] = useState<number | null>(null);
  const typing = keyboardHeight > 0;

  const measure = useCallback(() => {
    frameRef.current?.measureInWindow((_x, y, _width, height) => {
      setGapBelow(Math.max(0, windowHeight - (y + height)));
    });
  }, [windowHeight]);

  // Pad by how much the keyboard actually covers THIS view, not by its full
  // height: padding the tab bar's height as well would scroll the field being
  // typed in off the top.
  const overlap =
    gapBelow === null
      ? keyboardHeight
      : Math.max(0, keyboardHeight - gapBelow);

  // The keyboard opened: bring the field and its button into view.
  useEffect(() => {
    if (!typing) return;
    const id = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      60,
    );
    return () => clearTimeout(id);
  }, [typing, overlap]);

  return (
    <View
      ref={frameRef}
      onLayout={measure}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}
    >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // Switching to the code step keeps the keyboard up (no new "show"
        // event), so follow the content as it changes too.
        onContentSizeChange={() => {
          if (typing) scrollRef.current?.scrollToEnd({ animated: true });
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: (typing ? overlap : insets.bottom) + 32,
        }}
      >
        {header}
        <AuthPanel onDone={onDone} subtitle={subtitle} grow={!footer} />
        {footer && !typing ? <View className="mt-8">{footer}</View> : null}
      </ScrollView>
    </View>
  );
}
