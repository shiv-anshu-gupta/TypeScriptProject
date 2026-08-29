import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { setAppLanguage, type AppLanguage } from "@/lib/i18n";

// Shown once, on the very first launch, before anything else. Bilingual on
// purpose so a Hindi- or English-only user can both understand it.
export function LanguagePicker({ onSelect }: { onSelect: () => void }) {
  const choose = async (lang: AppLanguage) => {
    await setAppLanguage(lang);
    onSelect();
  };

  return (
    <View className="flex-1 items-center justify-center gap-10 bg-background px-8">
      <View className="items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
          <MaterialCommunityIcons name="notebook" size={30} color="#ffffff" />
        </View>
        <Text className="text-2xl font-bold tracking-tight text-foreground">
          sKirana
        </Text>
      </View>

      <View className="items-center gap-1">
        <Text className="text-xl font-semibold text-foreground">
          अपनी भाषा चुनें
        </Text>
        <Text className="text-base text-muted-foreground">
          Choose your language
        </Text>
      </View>

      <View className="w-full gap-3">
        <Pressable
          onPress={() => void choose("hi")}
          className="h-14 items-center justify-center rounded-2xl bg-primary active:opacity-90"
        >
          <Text className="text-lg font-bold text-primary-foreground">
            हिंदी
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void choose("en")}
          className="h-14 items-center justify-center rounded-2xl border border-border bg-card active:opacity-90"
        >
          <Text className="text-lg font-bold text-foreground">English</Text>
        </Pressable>
      </View>

      <Text className="text-center text-xs leading-5 text-muted-foreground">
        इसे बाद में Account में बदल सकते हैं
        {"\n"}
        You can change this later in Account
      </Text>
    </View>
  );
}
