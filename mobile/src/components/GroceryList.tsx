/**
 * The draft list as an inline block, for the Lists tab.
 *
 * @packageDocumentation
 */

import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GroceryListEditor } from "@/components/GroceryListEditor";
import { SendListButton } from "@/components/SendListButton";
import { ScanListPhoto } from "@/components/ScanListPhoto";

/**
 * The customer's unsent list shown inside a card, with the camera and Send
 * beneath it and a note that the shop will send the price.
 *
 * @remarks
 * The draft list as shown inline on the Lists tab: the written lines plus one
 * to continue on, with a full-width Send button under it. The list sheet uses
 * the same editor as a full page instead, with Send pinned in its header.
 *
 * It holds no state of its own — it is three components arranged. The draft
 * comes from `useDraftListStore` through {@link GroceryListEditor}, and the
 * whole send flow, including the phone prompt it may open, belongs to
 * {@link SendListButton}.
 */
export function GroceryList() {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      <GroceryListEditor compact />
      <View className="mx-3 gap-3">
        <View className="flex-row items-center gap-2">
          <ScanListPhoto />
          <View className="flex-1">
            <SendListButton variant="block" />
          </View>
        </View>
        <Text className="text-center text-xs font-medium text-muted-foreground">
          {t("home.priceNote")}
        </Text>
      </View>
    </View>
  );
}
