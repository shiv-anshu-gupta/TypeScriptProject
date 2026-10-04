/**
 * Who the seller is and how to complain - the short page behind Account ->
 * Shop details & complaints.
 *
 * @packageDocumentation
 */

import type { ReactNode } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import {
  GRIEVANCE_DESIGNATION,
  GRIEVANCE_OFFICER,
  SELLER_ADDRESS,
  SELLER_NAME,
  SELLER_PHONE,
} from "@/lib/shop";

const INK = "#3c5a64";
const CONSUMER_HELPLINE = "1915";

/** One labelled line with an icon, and an optional action on the right. */
function Row({
  icon,
  label,
  value,
  action,
  last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  action?: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={
        last
          ? "flex-row items-center gap-3 px-4 py-3.5"
          : "flex-row items-center gap-3 border-b border-border/60 px-4 py-3.5"
      }
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
        <Feather name={icon} size={16} color={INK} />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text className="text-base font-semibold text-foreground">{value}</Text>
      </View>
      {action}
    </View>
  );
}

/** A small pill that dials a number. */
function CallButton({ number, label }: { number: string; label: string }) {
  return (
    <Pressable
      onPress={() => void Linking.openURL(`tel:${number.replace(/\s+/g, "")}`)}
      accessibilityRole="button"
      hitSlop={6}
      className="flex-row items-center gap-1.5 rounded-full bg-primary px-3.5 py-2"
    >
      <Feather name="phone" size={13} color="#ffffff" />
      <Text className="text-xs font-semibold text-primary-foreground">{label}</Text>
    </Pressable>
  );
}

/**
 * The seller's name, address and customer-care number, then the grievance
 * officer and the 48-hour / one-month promise.
 *
 * @remarks
 * This is the "clear and accessible" display the Consumer Protection
 * (E-Commerce) Rules 2020 ask for (rules 4(2), 4(4) and 4(5)). The same
 * facts also open the full privacy policy and terms, where they belong as
 * part of the policy; this page is the short version a customer looks for
 * when something has gone wrong.
 */
export function ShopInfoScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 20 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("shopInfo.seller")}
        </Text>
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <Row icon="shopping-bag" label={t("shopInfo.shop")} value={SELLER_NAME} />
          <Row icon="map-pin" label={t("shopInfo.address")} value={SELLER_ADDRESS} />
          <Row
            icon="phone"
            label={t("shopInfo.phone")}
            value={SELLER_PHONE}
            action={<CallButton number={SELLER_PHONE} label={t("shopInfo.call")} />}
            last
          />
        </View>
      </View>

      <View className="gap-2">
        <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("shopInfo.complaints")}
        </Text>
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <Row
            icon="user"
            label={t("shopInfo.officer")}
            value={`${GRIEVANCE_OFFICER}, ${GRIEVANCE_DESIGNATION}`}
          />
          <View className="flex-row items-start gap-3 px-4 py-3.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
              <Feather name="clock" size={16} color={INK} />
            </View>
            <Text className="flex-1 text-sm leading-5 text-foreground">
              {t("shopInfo.promise")}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => void Linking.openURL(`tel:${CONSUMER_HELPLINE}`)}
          accessibilityRole="link"
          className="px-1 py-1"
        >
          <Text className="text-xs text-muted-foreground">
            {t("shopInfo.helpline", { number: CONSUMER_HELPLINE })}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
