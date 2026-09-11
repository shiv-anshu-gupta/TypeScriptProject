import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GroceryListEditor } from "@/components/GroceryListEditor";
import { SendListButton } from "@/components/SendListButton";

// The draft list as shown inline on the Lists tab: the editable paper with a
// full-width Send button under it. The list sheet composes the same editor
// differently, with Send pinned in its header instead.
export function GroceryList() {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      <GroceryListEditor />
      <View className="mx-3 gap-3">
        <SendListButton variant="block" />
        <Text className="text-center text-xs font-medium text-muted-foreground">
          {t("home.priceNote")}
        </Text>
      </View>
    </View>
  );
}
