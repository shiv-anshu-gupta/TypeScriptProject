import { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";
import { GroceryList } from "@/components/GroceryList";

const SCREEN_HEIGHT = Dimensions.get("window").height;

// The sliding grocery-list sheet opened by the centre tab button.
//
// Deliberately NOT a <Modal>: the list inside it already opens its own Modal
// (the phone prompt), and stacking a Modal inside a Modal is unreliable on
// Android. Rendering as an absolutely-positioned overlay at the app root keeps
// a single modal layer and gives full control over the slide animation.
export function GroceryListSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isOpen = useGrocerySheetStore((state) => state.isOpen);
  const close = useGrocerySheetStore((state) => state.close);

  // Keep the sheet mounted until the closing animation has finished.
  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  // The list is full of inputs; inside an overlay Android will not resize for
  // the keyboard, so measure it and pad the scroll content by that much.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, {
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

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
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
  }, [isOpen, translateY, backdrop]);

  // Android hardware back closes the sheet instead of leaving the screen.
  useEffect(() => {
    if (!isOpen) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, close]);

  if (!mounted) return null;

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

      <Animated.View
        style={{
          transform: [{ translateY }],
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: SCREEN_HEIGHT * 0.9,
          // The deep curve across the top, as in the reference.
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
        <View className="items-center pt-3">
          <View className="h-1.5 w-12 rounded-full bg-muted" />
        </View>

        {/* Close button only — the list's own intro card carries the title,
            so repeating it here would read as a duplicate heading. */}
        <View className="flex-row items-center justify-end px-5 pb-1 pt-2">
          <Pressable
            onPress={close}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <Feather name="x" size={16} color="#1f2a2e" />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{
            paddingBottom:
              (keyboardHeight > 0 ? keyboardHeight : insets.bottom) + 24,
          }}
        >
          <GroceryList />
        </ScrollView>
      </Animated.View>
    </View>
  );
}
