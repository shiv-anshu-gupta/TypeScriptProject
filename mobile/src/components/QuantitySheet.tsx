import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import {
  buildQuantityString,
  defaultQuantityValue,
} from "@/features/customer/draft-list/quantity";
import { formatPack } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
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
  const [value, setValue] = useState(defaultQuantityValue(unit, unitValue));

  // Reset to the sensible default each time it opens.
  useEffect(() => {
    if (open) setValue(defaultQuantityValue(unit, unitValue));
  }, [open, unit, unitValue]);

  const packLabel = formatPack(unit, unitValue);

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        onPress={onClose}
        className="flex-1 justify-end bg-black/50"
      >
        {/* Sheet — stop propagation so taps inside don't close it */}
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="gap-4 rounded-t-3xl border border-border bg-background px-5 pb-10 pt-4"
        >
          <View className="h-1.5 w-10 self-center rounded-full bg-muted" />

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
                  Sold per {packLabel}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center rounded-full bg-secondary"
            >
              <Feather name="x" size={16} color="#18181b" />
            </Pressable>
          </View>

          <Text className="text-sm font-medium text-foreground">
            How much do you want?
          </Text>

          <QuantityControl
            unit={unit}
            unitValue={unitValue}
            value={value}
            onChange={setValue}
          />

          <Button
            label="Add to list"
            icon={<Feather name="plus" size={16} color="#fafafa" />}
            onPress={() => {
              onConfirm(buildQuantityString(unit, unitValue, value));
              onClose();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
