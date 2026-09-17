import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import {
  buildQuantityString,
  defaultQuantityValue,
} from "@/features/customer/draft-list/quantity";
import { formatPack } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { QuantityControl } from "@/components/QuantityControl";

type QuantitySheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  unit?: string;
  unitValue?: number;
  onConfirm: (quantity: string) => void;
};

// Bottom-sheet quantity picker opened from a product card's "+".
export function QuantitySheet({
  open,
  onClose,
  title,
  unit,
  unitValue,
  onConfirm,
}: QuantitySheetProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultQuantityValue(unit, unitValue));

  // Reset to the sensible default each time it opens.
  useEffect(() => {
    if (open) setValue(defaultQuantityValue(unit, unitValue));
  }, [open, unit, unitValue]);

  const packLabel = formatPack(unit, unitValue);

  return (
    <Sheet open={open} onClose={onClose} bottomPadding={24}>
      <View className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text
              numberOfLines={2}
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </Text>
            {packLabel ? (
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {t("shop.soldPer", { pack: packLabel })}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
          >
            <Feather name="x" size={16} color="#1f2a2e" />
          </Pressable>
        </View>

        <Text className="text-sm font-medium text-foreground">
          {t("shop.howMuch")}
        </Text>

        <QuantityControl
          unit={unit}
          unitValue={unitValue}
          value={value}
          onChange={setValue}
        />

        <Button
          label={t("shop.addToList")}
          icon={<Feather name="plus" size={16} color="#ffffff" />}
          onPress={() => {
            onConfirm(buildQuantityString(unit, unitValue, value));
            onClose();
          }}
        />
      </View>
    </Sheet>
  );
}
