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

type ProfileEditSheetProps = {
  open: boolean;
  submitting: boolean;
  initialName: string;
  initialPhone: string;
  onClose: () => void;
  onSubmit: (values: { name: string; phone: string }) => void;
};

// Indian mobile: 10 digits starting 6–9 (after stripping +91 / leading 0).
function normalize(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}
function isValidPhone(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalize(raw));
}

// Mirrors the server's name allowlist so a rejected character never even
// appears: letters (English + Hindi), digits, spaces and . , & ' - / ( ) %.
function stripSpecials(value: string): string {
  return value.replace(/[!"#$*+:;<=>?@^_`{|}~[\]\\]/g, "");
}

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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Re-seed from the current values every time it opens.
  useEffect(() => {
    if (open) {
      setName(initialName);
      setPhone(initialPhone);
      setTouched(false);
    }
  }, [open, initialName, initialPhone]);

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

  const nameOk = name.trim().length > 0;
  const phoneOk = isValidPhone(phone);
  const canSave = nameOk && phoneOk && !submitting;

  const bottomPad =
    keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 20;

  const submit = () => {
    setTouched(true);
    if (!canSave) return;
    onSubmit({ name: name.trim(), phone: normalize(phone) });
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

          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-lg font-semibold text-foreground">
              {t("account.editTitle")}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
            >
              <Feather name="x" size={16} color="#1f2a2e" />
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
            {touched && !phoneOk ? (
              <Text className="text-xs text-destructive">
                {t("phone.invalid")}
              </Text>
            ) : null}
          </View>

          <Button
            label={t("common.save")}
            loading={submitting}
            disabled={!canSave}
            onPress={submit}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
