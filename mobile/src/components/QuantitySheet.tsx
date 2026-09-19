/**
 * The quantity picker sheet, and the single instance of it mounted at the app
 * root.
 *
 * @packageDocumentation
 */

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
import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useQuantitySheetStore } from "@/features/customer/quantity-sheet/store";
import { toast } from "@/lib/toast";
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

/**
 * A short sheet asking how much of one product the customer wants, with the
 * exact wording the shop will receive shown underneath.
 *
 * @remarks
 * Bottom-sheet quantity picker opened from a product card's "+".
 *
 * A controlled component: it holds only the number being picked, and resets
 * that to the product's sensible default each time it opens. It does not touch
 * the draft list — `onConfirm` receives the finished quantity string and the
 * caller decides what to do with it.
 *
 * Screens should not mount this directly. {@link QuantitySheetHost} is the one
 * instance, and a product card opens it through the store.
 *
 * @param unit - The product's selling unit, such as `kg` or `pack`. It decides
 * the step size, the bounds, the preset chips and whether the number is typed
 * or stepped.
 * @param unitValue - The pack size, for something sold in fixed packs.
 * @param onConfirm - Given the finished quantity as the shop will read it, for
 * example `2 kg`, not the raw number.
 */
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

/**
 * The quantity picker the whole app shares, mounted once at the root.
 *
 * @remarks
 * The app's single quantity picker, mounted once at the root. Every product
 * card opens THIS one through the store, so a grid of cards carries no sheets
 * of its own.
 *
 * The reason is cost: a sheet is not free even while closed — it measures the
 * window, reads the safe area, creates shared values and a gesture. Twenty of
 * those on a cheap phone is paid for at exactly the wrong moment, while the
 * customer scrolls.
 *
 * It reads `useQuantitySheetStore` for the product being asked about, writes
 * the answer into the draft list with `addProductWithQuantity` — which sets
 * the quantity outright rather than adding to it — and toasts the result.
 *
 * @see {@link QuantitySheet} for the sheet itself.
 */
export function QuantitySheetHost() {
  const { t } = useTranslation();
  const target = useQuantitySheetStore((state) => state.target);
  const close = useQuantitySheetStore((state) => state.close);
  const addProductWithQuantity = useDraftListStore(
    (state) => state.addProductWithQuantity,
  );

  return (
    <QuantitySheet
      open={Boolean(target)}
      onClose={close}
      // Kept from the last product while the sheet slides away, so the title
      // doesn't blank out mid-animation.
      title={target?.title ?? ""}
      unit={target?.unit}
      unitValue={target?.unitValue}
      onConfirm={(quantity) => {
        if (!target) return;
        addProductWithQuantity(target.title, quantity);
        toast.success(t("product.added"));
      }}
    />
  );
}
