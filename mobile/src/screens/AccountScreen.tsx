import { useCallback, useState, type ReactNode } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { Button } from "@/components/ui/Button";
import { env } from "@/lib/env";
import { setAppLanguage, type AppLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INK = "#1f2a2e";
const PRIMARY = "#3c5a64";
const ANDROID_PACKAGE = "com.skirana.app";

// The language switch — used on the Account screen and offered to signed-out
// users too, so anyone can flip हिंदी/English at any time.
function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const options: { code: AppLanguage; label: string }[] = [
    { code: "hi", label: "हिंदी" },
    { code: "en", label: "English" },
  ];
  return (
    <View>
      <Text className="mb-2 text-lg font-semibold text-foreground">
        {t("common.language")}
      </Text>
      <View className="flex-row gap-2">
        {options.map((option) => {
          const active = i18n.language === option.code;
          return (
            <Pressable
              key={option.code}
              onPress={() => void setAppLanguage(option.code)}
              className={cn(
                "flex-1 items-center rounded-xl border py-3",
                active ? "border-primary bg-primary" : "border-border bg-card",
              )}
            >
              <Text
                className={cn(
                  "text-base font-semibold",
                  active ? "text-primary-foreground" : "text-foreground",
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// One "label above value" line inside the details card.
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text className="text-base font-semibold text-foreground">{value}</Text>
      </View>
    </View>
  );
}

// One of the three summary tiles.
function StatCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 items-center gap-1 rounded-2xl border border-border bg-card px-2 py-4">
      {icon}
      <Text className="text-lg font-bold text-primary">{value}</Text>
      <Text className="text-center text-[11px] text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}

// A tappable settings row: icon bubble, title + subtitle, chevron.
function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  last,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 px-4 py-3.5",
        !last && "border-b border-border/60",
      )}
    >
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="text-xs text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={18} color="#ada291" />
    </Pressable>
  );
}

export function AccountScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [langOpen, setLangOpen] = useState(false);

  const { items, customerPhone, loadLists } = useCustomerGroceryListStore(
    (state) => state,
  );

  // Keep the counters fresh whenever the tab is opened.
  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) void loadLists();
    }, [isSignedIn, loadLists]),
  );

  if (!isSignedIn) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-8"
        style={{ paddingTop: insets.top }}
      >
        <Feather name="user" size={36} color="#ada291" />
        <Text className="text-center text-base text-muted-foreground">
          {t("account.signedOutPrompt")}
        </Text>
        <View className="w-full gap-2">
          <Button
            label={t("common.signIn")}
            onPress={() => navigation.navigate("SignIn")}
          />
          <Button
            label={t("account.createAccount")}
            variant="outline"
            onPress={() => navigation.navigate("SignUp")}
          />
        </View>

        <View className="w-full">
          <LanguageToggle />
        </View>

        <Text
          className="text-xs text-muted-foreground underline"
          onPress={() => navigation.navigate("Legal")}
        >
          {t("auth.privacyTerms")}
        </Text>
      </View>
    );
  }

  const name = user?.fullName ?? t("account.customer");
  const emailAddress = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (name || "U").charAt(0).toUpperCase();

  // Counters. Cancelled lists are not counted as orders placed.
  const orders = items.filter((list) => list.status !== "cancelled");
  const now = new Date();
  const thisMonth = orders.filter((list) => {
    const d = new Date(list.createdAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;

  // "Member since": whole months once there is at least one, else days.
  const createdAt = user?.createdAt ? new Date(user.createdAt) : null;
  const days = createdAt
    ? Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 86400000))
    : 0;
  const months = Math.floor(days / 30);
  const memberValue =
    months >= 1
      ? t("account.monthsValue", { n: months })
      : t("account.daysValue", { n: days });

  const openWhatsapp = () => {
    const number = env.shopWhatsapp;
    if (!number) return;
    Linking.openURL(`whatsapp://send?phone=${number}`).catch(() => {
      void Linking.openURL(`https://wa.me/${number}`).catch(() => {});
    });
  };

  const openStoreListing = () => {
    Linking.openURL(`market://details?id=${ANDROID_PACKAGE}`).catch(() => {
      void Linking.openURL(
        `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`,
      ).catch(() => {});
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 40,
        gap: 12,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Identity header */}
      <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-secondary p-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Text className="text-xl font-bold text-primary-foreground">
            {initial}
          </Text>
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-lg font-bold text-foreground">
            {name}
          </Text>
          {emailAddress ? (
            <Text numberOfLines={1} className="text-sm text-muted-foreground">
              {emailAddress}
            </Text>
          ) : null}
        </View>
      </View>

      {/* My details */}
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        <Text className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">
          {t("account.myDetails")}
        </Text>
        <InfoRow
          icon={<Feather name="smartphone" size={16} color={PRIMARY} />}
          label={t("account.mobile")}
          value={customerPhone || t("account.notAdded")}
        />
        <View className="h-px bg-border/60" />
        <InfoRow
          icon={<Feather name="mail" size={16} color={PRIMARY} />}
          label={t("account.email")}
          value={emailAddress || t("account.notAdded")}
        />
      </View>

      {/* Stats */}
      <View className="flex-row gap-2">
        <StatCard
          icon={
            <MaterialCommunityIcons
              name="package-variant"
              size={20}
              color={PRIMARY}
            />
          }
          value={String(orders.length)}
          label={t("account.totalOrders")}
        />
        <StatCard
          icon={<Feather name="calendar" size={20} color={PRIMARY} />}
          value={String(thisMonth)}
          label={t("account.thisMonth")}
        />
        <StatCard
          icon={<Feather name="star" size={20} color={PRIMARY} />}
          value={memberValue}
          label={t("account.memberSince")}
        />
      </View>

      {/* Settings */}
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        <MenuRow
          icon={<Feather name="bell" size={18} color={INK} />}
          title={t("account.notifications")}
          subtitle={t("account.notificationsSub")}
          onPress={() => void Linking.openSettings().catch(() => {})}
        />
        <MenuRow
          icon={<Feather name="globe" size={18} color={INK} />}
          title={t("common.language")}
          subtitle={i18n.language === "hi" ? "हिंदी" : "English"}
          onPress={() => setLangOpen((open) => !open)}
        />
        {langOpen ? (
          <View className="border-b border-border/60 px-4 pb-4">
            <LanguageToggle />
          </View>
        ) : null}
        <MenuRow
          icon={<Feather name="heart" size={18} color={INK} />}
          title={t("account.savedProducts")}
          subtitle={t("account.savedProductsSub")}
          onPress={() => navigation.navigate("Wishlist")}
        />
        {env.shopWhatsapp ? (
          <MenuRow
            icon={<Feather name="message-circle" size={18} color={INK} />}
            title={t("account.help")}
            subtitle={t("account.helpSub")}
            onPress={openWhatsapp}
          />
        ) : null}
        <MenuRow
          icon={<Feather name="star" size={18} color={INK} />}
          title={t("account.rate")}
          subtitle={t("account.rateSub")}
          onPress={openStoreListing}
        />
        <MenuRow
          icon={<Feather name="file-text" size={18} color={INK} />}
          title={t("account.terms")}
          onPress={() => navigation.navigate("Legal")}
          last
        />
      </View>

      {/* Sign out */}
      <Pressable
        onPress={() => void signOut()}
        className="items-center rounded-2xl border border-destructive/40 bg-card py-3.5"
      >
        <Text className="text-base font-semibold text-destructive">
          {t("account.signOut")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
