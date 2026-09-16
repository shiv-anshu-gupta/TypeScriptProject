import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useKeyboardHeight } from "@/lib/use-keyboard-height";
import { isValidMobile, normalizeMobile } from "@/lib/phone";
import { stripSpecials } from "@/lib/clean-text";

type ProfileEditSheetProps = {
  open: boolean;
  submitting: boolean;
  initialName: string;
  initialPhone: string;
  onClose: () => void;
  // `phone` is left out when the customer hasn't given one - the server
  // rejects an empty number, and the name alone is a valid save.
  onSubmit: (values: { name: string; phone?: string }) => void;
};

// Lets the customer correct the name and mobile the SHOP sees on their orders.
// Opened from the "Edit" button on the Account screen.
export function ProfileEditSheet({
  open,
  submitting,
  initialName,
  initialPhone,
  onClose,
  onSubmit,
}: ProfileEditSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [touched, setTouched] = useState(false);
  // Measure the keyboard directly and lift the sheet by that much — a
  // KeyboardAvoidingView is unreliable inside a Modal on Android.
  const keyboardHeight = useKeyboardHeight();

  // Re-seed from the current values every time it opens.
  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhone(initialPhone);
      setTouched(false);
    }
  }, [open, initialName, initialPhone]);

  const nameOk = name.trim().length > 0;
  // A mobile number is optional here - the server accepts the name on its own.
  // It only has to be valid IF something was typed, so a customer who hasn't
  // given their number yet can still fix their name.
  const phoneEntered = phone.trim().length > 0;
  const phoneOk = !phoneEntered || isValidMobile(phone);
  const canSave = nameOk && phoneOk && !submitting;

  const bottomPad =
    keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 20;

  const submit = () => {
    setTouched(true);
    if (!canSave) return;
    onSubmit({
      name: name.trim(),
      ...(phoneEntered ? { phone: normalizeMobile(phone) } : {}),
    });
  };

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

          {/* Pinned header: close on the left, Save on the right. At the top
              it stays visible with the keypad open - a button under the
              fields ends up behind it. */}
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common.close")}
              className="h-9 w-9 items-center justify-center rounded-full bg-secondary"
            >
              <Feather name="x" size={17} color="#1f2a2e" />
            </Pressable>

            <Text className="flex-1 text-base font-semibold text-foreground">
              {t("account.editTitle")}
            </Text>

            <Pressable
              onPress={submit}
              disabled={submitting}
              accessibilityRole="button"
              accessibilityState={{ disabled: submitting }}
              accessibilityLabel={t("common.save")}
              className={`h-10 flex-row items-center gap-1.5 rounded-full px-4 active:opacity-85 ${
                canSave ? "bg-primary" : "bg-primary/40"
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Feather name="check" size={16} color="#ffffff" />
              )}
              <Text className="text-sm font-bold text-primary-foreground">
                {t("common.save")}
              </Text>
            </Pressable>
          </View>

          {/* Name */}
          <View className="gap-1.5">
            <Text className="text-xs font-medium text-muted-foreground">
              {t("account.fullName")}
            </Text>
            <TextInput
              value={name}
              onChangeText={(text) => setName(stripSpecials(text))}
              placeholder={t("account.namePlaceholder")}
              placeholderTextColor="#ada291"
              maxLength={50}
              className="h-12 rounded-xl border border-border bg-card px-3 text-base text-foreground"
            />
            {touched && !nameOk ? (
              <Text className="text-xs text-destructive">
                {t("account.nameRequired")}
              </Text>
            ) : null}
          </View>

          {/* Mobile */}
          <View className="gap-1.5">
            <Text className="text-xs font-medium text-muted-foreground">
              {t("account.mobile")}
            </Text>
            <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
              <Text className="text-base font-medium text-muted-foreground">
                +91
              </Text>
              <View className="h-6 w-px bg-border" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="98765 43210"
                placeholderTextColor="#ada291"
                keyboardType="phone-pad"
                maxLength={15}
                className="h-12 flex-1 text-base text-foreground"
              />
              {phoneOk ? (
                <Feather name="check-circle" size={18} color="#4f7a4d" />
              ) : null}
            </View>
            {(touched || phoneEntered) && !phoneOk ? (
              <Text className="text-xs text-destructive">
                {t("phone.invalid")}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
