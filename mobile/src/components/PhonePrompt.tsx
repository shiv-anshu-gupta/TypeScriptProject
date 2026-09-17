import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { Sheet, SheetTextInput } from "@/components/ui/Sheet";
import { isValidMobile, normalizeMobile } from "@/lib/phone";

type PhonePromptProps = {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (phone: string) => void;
};

// Asked once, the first time a customer sends a list, so the shop can call them
// about their order. Includes a short trust line explaining why.
export function PhonePrompt({
  open,
  submitting,
  onClose,
  onSubmit,
}: PhonePromptProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setValue("");
      setTouched(false);
    }
  }, [open]);

  const valid = isValidMobile(value);

  return (
    <Sheet open={open} onClose={onClose}>
      <View className="gap-4">
        {/* Pinned header: close on the left, the action on the right - the
              same layout as the list sheet. At the top it stays visible with
              the keypad open, which a button under the text did not. */}
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
            {t("phone.title")}
          </Text>

          <Pressable
            onPress={() => onSubmit(normalizeMobile(value))}
            disabled={!valid || submitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: !valid || submitting }}
            accessibilityLabel={t("phone.save")}
            className={`h-10 flex-row items-center gap-1.5 rounded-full px-4 active:opacity-85 ${
              valid && !submitting ? "bg-primary" : "bg-primary/40"
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <MaterialCommunityIcons name="send" size={16} color="#ffffff" />
            )}
            <Text className="text-sm font-bold text-primary-foreground">
              {t("phone.send")}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
          <Text className="text-base font-medium text-muted-foreground">
            +91
          </Text>
          <View className="h-6 w-px bg-border" />
          <SheetTextInput
            value={value}
            onChangeText={setValue}
            onBlur={() => setTouched(true)}
            onSubmitEditing={() => {
              if (valid && !submitting) onSubmit(normalizeMobile(value));
            }}
            returnKeyType="send"
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
          <Text className="text-xs text-destructive">{t("phone.invalid")}</Text>
        ) : null}

        {/* Trust line — why we ask */}
        <View className="flex-row items-start gap-2 rounded-xl bg-secondary p-3">
          <Feather name="shield" size={15} color="#6f6857" />
          <Text className="flex-1 text-xs leading-5 text-muted-foreground">
            {t("phone.trust")}
          </Text>
        </View>
      </View>
    </Sheet>
  );
}
