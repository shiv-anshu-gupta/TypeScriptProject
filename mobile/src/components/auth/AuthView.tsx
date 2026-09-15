import { useEffect, useRef, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
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
  const scrollRef = useRef<ScrollView>(null);
  const typing = keyboardHeight > 0;

  // The keyboard opened: bring the field and its button into view.
  useEffect(() => {
    if (!typing) return;
    const id = setTimeout(
      () => scrollRef.current?.scrollToEnd({ animated: true }),
      60,
    );
    return () => clearTimeout(id);
  }, [typing, keyboardHeight]);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
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
          paddingBottom: (typing ? keyboardHeight : insets.bottom) + 32,
        }}
      >
        {header}
        <AuthPanel onDone={onDone} subtitle={subtitle} grow={!footer} />
        {footer && !typing ? <View className="mt-8">{footer}</View> : null}
      </ScrollView>
    </View>
  );
}
