import { Pressable, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  autoFocus?: boolean;
};

// The one product-search field, shared by Home and Shop so both look and behave
// the same. Sizing is left to the caller: wrap it in a flex-1 view in a row, or
// let it fill the width in a column.
export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  autoFocus,
}: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
      <Feather name="search" size={16} color="#6f6857" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor="#ada291"
        autoFocus={autoFocus}
        returnKeyType="search"
        maxLength={60}
        className="h-11 flex-1 text-base text-foreground"
      />
      {value ? (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("common.clearSearch")}
        >
          <Feather name="x-circle" size={16} color="#6f6857" />
        </Pressable>
      ) : null}
    </View>
  );
}
