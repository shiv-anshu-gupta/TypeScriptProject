import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import {
  buildQuantityString,
  isCountableUnit,
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

// A unit-aware quantity picker shared by the card sheet and the details screen.
export function QuantityControl({
  unit,
  unitValue,
  value,
  onChange,
}: QuantityControlProps) {
  const countable = isCountableUnit(unit, unitValue);
  const step = countable ? 1 : stepFor(unit);
  const min = minFor(unit, unitValue);

  const [text, setText] = useState(String(value));

  const commit = (next: number) => {
    const clamped = roundValue(Math.max(min, next));
    setText(String(clamped));
    onChange(clamped);
  };

  const dec = () => commit(value - step);
  const inc = () => commit(value + step);

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
          hitSlop={6}
          className="h-11 w-11 items-center justify-center rounded-lg bg-secondary active:opacity-70"
        >
          <Feather name="minus" size={20} color="#18181b" />
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
                // Allow free typing; commit a valid number as it goes.
                setText(t);
                const parsed = Number(t);
                if (!Number.isNaN(parsed) && parsed > 0) onChange(parsed);
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
          hitSlop={6}
          className="h-11 w-11 items-center justify-center rounded-lg bg-secondary active:opacity-70"
        >
          <Feather name="plus" size={20} color="#18181b" />
        </Pressable>
      </View>

      {/* What the shop will see */}
      <Text className="text-center text-xs text-muted-foreground">
        Shop will receive:{" "}
        <Text className="font-semibold text-foreground">
          {buildQuantityString(unit, unitValue, value)}
        </Text>
      </Text>
    </View>
  );
}
