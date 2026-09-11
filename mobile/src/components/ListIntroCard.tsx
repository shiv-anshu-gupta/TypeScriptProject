import { Text, View } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";
import { Button } from "@/components/ui/Button";

// One numbered step in the "how this works" strip.
function Step({ n, label }: { n: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-1">
      <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
        <Text className="text-[11px] font-bold text-primary-foreground">
          {n}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        className="text-[11px] font-semibold text-foreground"
      >
        {label}
      </Text>
    </View>
  );
}

// The Home screen's lead card: what the app does, in four steps. The list
// itself lives in the sheet behind the centre tab button, so the card ends in a
// button that opens it - explaining a list without a way to reach it would be a
// dead end.
export function ListIntroCard() {
  const { t } = useTranslation();
  const openSheet = useGrocerySheetStore((state) => state.open);

  return (
    <View className="mx-4 gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary">
          <MaterialCommunityIcons
            name="notebook-edit-outline"
            size={22}
            color="#ffffff"
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">
            {t("home.listTitle")}
          </Text>
          <Text className="mt-0.5 text-xs leading-4 text-muted-foreground">
            {t("home.listSubtitle")}
          </Text>
        </View>
      </View>

      {/* Write -> Send -> Get the price -> Collect: the whole journey, the same
          four steps the Home promo banner shows */}
      <View className="flex-row items-center rounded-xl bg-secondary px-1.5 py-2.5">
        <Step n="1" label={t("home.step1")} />
        <Feather name="chevron-right" size={13} color="#ada291" />
        <Step n="2" label={t("home.step2")} />
        <Feather name="chevron-right" size={13} color="#ada291" />
        <Step n="3" label={t("home.step3")} />
        <Feather name="chevron-right" size={13} color="#ada291" />
        <Step n="4" label={t("home.step4")} />
      </View>

      <Button
        label={t("tabs.writeList")}
        icon={
          <MaterialCommunityIcons
            name="playlist-plus"
            size={20}
            color="#ffffff"
          />
        }
        onPress={openSheet}
      />
    </View>
  );
}
