import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

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
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setValue("");
      setTouched(false);
    }
  }, [open]);

  const valid = isValid(value);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="gap-4 rounded-t-3xl border border-border bg-background px-5 pb-10 pt-4"
          >
          <View className="h-1.5 w-10 self-center rounded-full bg-muted" />

          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">
                अपना मोबाइल नंबर डालें
              </Text>
              <Text className="mt-0.5 text-sm text-muted-foreground">
                Enter your mobile number
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
              placeholder="10-digit number"
              placeholderTextColor="#ada291"
              className="h-12 flex-1 text-base text-foreground"
            />
            {valid ? (
              <Feather name="check-circle" size={18} color="#4f7a4d" />
            ) : null}
          </View>

          {touched && value.length > 0 && !valid ? (
            <Text className="text-xs text-destructive">
              सही 10 अंकों का नंबर डालें · Enter a valid 10-digit number
            </Text>
          ) : null}

          {/* Trust line — why we ask */}
          <View className="flex-row items-start gap-2 rounded-xl bg-secondary p-3">
            <Feather name="shield" size={15} color="#6f6857" />
            <Text className="flex-1 text-xs leading-5 text-muted-foreground">
              ये नंबर हम सिर्फ़ ज़रूरत पड़ने पर आपको कॉल करने के लिए ले रहे हैं।
              {"\n"}
              We'll only use this to call you about your order if needed.
            </Text>
          </View>

          <Button
            label="Save & send list"
            loading={submitting}
            disabled={!valid}
            onPress={() => onSubmit(normalize(value))}
          />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
