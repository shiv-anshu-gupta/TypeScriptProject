import { useEffect, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";

type PhonePromptProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => void;
};

// Indian mobile: 10 digits starting 6–9 (after stripping +91 / leading 0).
function normalize(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}
function isValid(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalize(raw));
}

// Asked once, the first time a customer sends a list, so the shop can call them
// about their order. Includes a short trust line explaining why.
export function PhonePrompt({
  open,
  submitting,
  onClose,
  onSubmit,
}: PhonePromptProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  // Measure the keyboard height directly and lift the sheet by that much. A
  // KeyboardAvoidingView is unreliable inside a Modal on Android (the Modal is
  // a separate window that doesn't receive the resize), which is why the input
  // was getting hidden behind the keypad.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (open) {
      setValue("");
      setTouched(false);
    }
  }, [open]);

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

  const valid = isValid(value);

  // Push the sheet's content up above the keyboard when it's open; otherwise
  // just clear the home indicator / gesture bar.
  const bottomPad =
    keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 20;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{ paddingBottom: bottomPad }}
          className="gap-4 rounded-t-3xl border border-border bg-background px-5 pt-3"
        >
          <View className="h-1.5 w-10 self-center rounded-full bg-muted" />

          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">
                {t("phone.title")}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
            >
              <Feather name="x" size={16} color="#1f2a2e" />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
            <Text className="text-base font-medium text-muted-foreground">
              +91
            </Text>
            <View className="h-6 w-px bg-border" />
            <TextInput
              value={value}
              onChangeText={setValue}
              onBlur={() => setTouched(true)}
              keyboardType="phone-pad"
              maxLength={14}
              autoFocus
              placeholder={t("phone.placeholder")}
              placeholderTextColor="#ada291"
              className="h-12 flex-1 text-base text-foreground"
            />
            {valid ? (
              <Feather name="check-circle" size={18} color="#4f7a4d" />
            ) : null}
          </View>

          {touched && value.length > 0 && !valid ? (
            <Text className="text-xs text-destructive">
              {t("phone.invalid")}
            </Text>
          ) : null}

          {/* Trust line — why we ask */}
          <View className="flex-row items-start gap-2 rounded-xl bg-secondary p-3">
            <Feather name="shield" size={15} color="#6f6857" />
            <Text className="flex-1 text-xs leading-5 text-muted-foreground">
              {t("phone.trust")}
            </Text>
          </View>

          <Button
            label={t("phone.save")}
            loading={submitting}
            disabled={!valid}
            onPress={() => onSubmit(normalize(value))}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
