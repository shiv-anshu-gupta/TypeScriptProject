/**
 * "Order again": the customer's last finished list, one tap back onto the
 * paper.
 *
 * @packageDocumentation
 */

import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";
import { toast } from "@/lib/toast";
import type { CustomerGroceryList } from "@/features/customer/grocery-list/types";

/** How many item names show as chips before "+N". */
const PREVIEW = 4;

/**
 * The basket to offer again: the newest `completed` order, with the items
 * the shop could not supply left out. `null` when there is nothing to offer.
 */
export function pickReorder(lists: CustomerGroceryList[]) {
  const last = lists
    .filter((list) => list.status === "completed")
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
  if (!last) return null;
  const items = last.items.filter((item) => item.available !== false);
  return items.length ? { list: last, items } : null;
}

/**
 * The most recent collected order, offered back as a new list.
 *
 * @remarks
 * A kirana basket repeats week to week, so the most useful thing on Home for
 * a returning customer is the last one again. Only a `completed` order is
 * offered - one still in progress is on the journey card already, and a
 * cancelled one is a basket the customer chose not to have.
 *
 * Tapping writes the items onto the draft paper (the same path a photo scan
 * uses, so an item already on the paper is not added twice) and opens the
 * list sheet, where the customer edits before sending. Nothing is sent from
 * here, and items the shop marked unavailable last time are left out.
 *
 * Renders nothing signed out or before the first collected order.
 */
export function ReorderCard() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const lists = useCustomerGroceryListStore((state) => state.items);
  const addScannedLines = useDraftListStore((state) => state.addScannedLines);

  const offer = useMemo(() => pickReorder(lists), [lists]);

  if (!isSignedIn || !offer) return null;
  const { list: last, items } = offer;

  const reorder = () => {
    const written = addScannedLines(
      items.map((item) => ({ name: item.name, quantity: item.quantity })),
    );
    if (written === 0) {
      toast.info(t("home.reorderAllThere"));
    } else {
      toast.success(t("home.reorderAdded", { count: written }));
    }
    useGrocerySheetStore.getState().open();
  };

  const shown = items.slice(0, PREVIEW);
  const more = items.length - shown.length;

  return (
    <View className="mx-4 gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <Feather name="rotate-ccw" size={18} color="#3c5a64" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">
            {t("home.reorderTitle")}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {t("home.reorderSub", { code: last.code, count: items.length })}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-1.5">
        {shown.map((item, index) => (
          <View
            key={`${last._id}-${index}`}
            className="rounded-full bg-secondary px-2.5 py-1"
          >
            <Text className="text-xs text-foreground" numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        ))}
        {more > 0 ? (
          <View className="rounded-full bg-secondary px-2.5 py-1">
            <Text className="text-xs font-semibold text-muted-foreground">
              +{more}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={reorder}
        accessibilityRole="button"
        className="h-11 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-90"
      >
        <Feather name="plus" size={16} color="#ffffff" />
        <Text className="text-sm font-semibold text-primary-foreground">
          {t("home.reorderButton")}
        </Text>
      </Pressable>
    </View>
  );
}
