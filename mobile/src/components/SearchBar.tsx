/**
 * The product search field, and the button that looks like it.
 *
 * @packageDocumentation
 */

import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder: string;
  autoFocus?: boolean;
};

/**
 * The box the customer types a product name into, with a clear button once
 * there is something in it.
 *
 * @remarks
 * The one product-search field, shared by Home and Shop so both look and behave
 * the same. Sizing is left to the caller: wrap it in a flex-1 view in a row, or
 * let it fill the width in a column.
 *
 * Fully controlled, and it debounces nothing — the caller decides when to ask
 * the server. The Shop screen also remounts it by key to take focus again when
 * it is already open.
 *
 * @param onSubmit - The keyboard's search key. Results normally appear as the
 * customer types, so this is a convenience, not the way to search.
 */
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

type SearchEntryProps = {
  placeholder: string;
  onPress: () => void;
};

/**
 * A search box on the Home screen that cannot be typed into — tapping it goes
 * to the Shop tab with the real field focused.
 *
 * @remarks
 * Looks exactly like the search field, but is a button that takes the customer
 * straight to where searching happens (the Shop tab, field focused, results
 * appearing as they type). Typing into a field that shows nothing until you
 * find the keyboard's search key looks broken, especially to someone who
 * doesn't know that key is there.
 *
 * @see {@link SearchBar} for the field this imitates.
 */
export function SearchEntry({ placeholder, onPress }: SearchEntryProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      className="h-14 flex-row items-center gap-3 rounded-2xl border-[1.5px] border-primary/40 bg-card pl-2 pr-4 active:opacity-90"
      style={{
        shadowColor: "#3c5a64",
        shadowOpacity: 0.14,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
        <Feather name="search" size={18} color="#ffffff" />
      </View>
      <Text
        numberOfLines={1}
        className="flex-1 text-base font-medium text-[#8a8273]"
      >
        {placeholder}
      </Text>
      <Feather name="arrow-right" size={18} color="#3c5a64" />
    </Pressable>
  );
}
