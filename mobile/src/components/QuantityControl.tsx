/**
 * The unit-aware quantity stepper.
 *
 * @packageDocumentation
 */

import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import {
  buildQuantityString,
  isCountableUnit,
  maxFor,
  minFor,
  quickChips,
  roundValue,
  stepFor,
} from "@/features/customer/draft-list/quantity";

type QuantityControlProps = {
  unit?: string;
  unitValue?: number;
  value: number;
  onChange: (value: number) => void;
};

/**
 * A minus/plus stepper with preset chips, showing the customer the exact
 * quantity the shop will be sent.
 *
 * @remarks
 * A unit-aware quantity picker shared by the card sheet and the details screen.
 *
 * The unit decides everything about how it behaves. Something countable steps
 * whole units and shows a plain number; something loose steps in its own
 * increments, offers preset chips and lets the number be typed. Bounds come
 * from the same unit helpers, and the stepper button that would go past a
 * limit is disabled rather than hidden.
 *
 * Controlled: it owns only the text being typed, and keeps that in step with
 * `value` so the box, the preview and what Add sends can never disagree.
 *
 * @param unit - The product's selling unit. See the remarks — this is not
 * decoration, it selects the whole interaction.
 * @param unitValue - The pack size, for something sold in fixed packs.
 * @param value - The number in the product's own unit, not a count of packs.
 */
export function QuantityControl({
  unit,
  unitValue,
  value,
  onChange,
}: QuantityControlProps) {
  const { t } = useTranslation();
  const countable = isCountableUnit(unit, unitValue);
  const step = countable ? 1 : stepFor(unit);
  const min = minFor(unit, unitValue);
  // Ceiling in this product's unit: 100 packs, or 5000 g / ml loose.
  const max = maxFor(unit, unitValue);

  const [text, setText] = useState(String(value));

  // The sheet keeps this component mounted between openings and resets
  // `value` to the product's default, so the box has to follow - otherwise it
  // shows the last number while the preview shows the new one, and Add sends
  // the number the customer can't see.
  useEffect(() => {
    setText(String(roundValue(value)));
  }, [value]);

  const commit = (next: number) => {
    const clamped = roundValue(Math.min(max, Math.max(min, next)));
    setText(String(clamped));
    onChange(clamped);
  };

  const dec = () => commit(value - step);
  const inc = () => commit(value + step);

  // Bounds — disable the stepper button that would go past the limit.
  const atMin = roundValue(value) <= min;
  const atMax = roundValue(value) >= max;

  const chips = countable ? [] : quickChips(unit);

  return (
    <View className="gap-3">
      {/* Quick presets for loose items */}
      {chips.length ? (
        <View className="flex-row flex-wrap gap-2">
          {chips.map((chip) => {
            const active = roundValue(value) === roundValue(chip);
            return (
              <Pressable
                key={chip}
                onPress={() => commit(chip)}
                className={
                  active
                    ? "rounded-full border border-primary bg-primary px-3.5 py-1.5"
                    : "rounded-full border border-border bg-card px-3.5 py-1.5"
                }
              >
                <Text
                  className={
                    active
                      ? "text-sm font-semibold text-primary-foreground"
                      : "text-sm font-medium text-foreground"
                  }
                >
                  {chip} {unit}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Stepper */}
      <View className="flex-row items-center justify-between rounded-xl border border-border bg-card p-2">
        <Pressable
          onPress={dec}
          disabled={atMin}
          hitSlop={6}
          className={
            atMin
              ? "h-11 w-11 items-center justify-center rounded-lg bg-secondary opacity-40"
              : "h-11 w-11 items-center justify-center rounded-lg bg-secondary active:opacity-70"
          }
        >
          <Feather name="minus" size={20} color="#1f2a2e" />
        </Pressable>

        <View className="flex-1 flex-row items-baseline justify-center gap-1.5">
          {countable ? (
            <Text className="text-2xl font-bold text-foreground">
              {Math.max(1, Math.round(value))}
            </Text>
          ) : (
            <TextInput
              value={text}
              onChangeText={(t) => {
                // Allow free typing; commit a valid number (capped for this unit).
                setText(t);
                const parsed = Number(t);
                if (!Number.isNaN(parsed) && parsed > 0) {
                  onChange(Math.min(max, parsed));
                }
              }}
              onBlur={() => {
                const parsed = Number(text);
                commit(Number.isNaN(parsed) || parsed <= 0 ? min : parsed);
              }}
              keyboardType="decimal-pad"
              className="min-w-16 text-center text-2xl font-bold text-foreground"
            />
          )}
          <Text className="text-base font-medium text-muted-foreground">
            {countable
              ? unitValue && unitValue !== 1
                ? `× ${unitValue} ${unit}`
                : unit === "dozen" || unit === "pack"
                  ? unit
                  : "pcs"
              : unit}
          </Text>
        </View>

        <Pressable
          onPress={inc}
          disabled={atMax}
          hitSlop={6}
          className={
            atMax
              ? "h-11 w-11 items-center justify-center rounded-lg bg-secondary opacity-40"
              : "h-11 w-11 items-center justify-center rounded-lg bg-secondary active:opacity-70"
          }
        >
          <Feather name="plus" size={20} color="#1f2a2e" />
        </Pressable>
      </View>

      {/* What the shop will see */}
      <Text className="text-center text-xs text-muted-foreground">
        {t("product.shopWillReceive")}{" "}
        <Text className="font-semibold text-foreground">
          {buildQuantityString(unit, unitValue, value)}
        </Text>
      </Text>
    </View>
  );
}
