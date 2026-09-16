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
import { updateCustomerProfile } from "@/features/customer/account/api";
import { useCustomerAccountStore } from "@/features/customer/account/store";
import { useCustomerDisplayName } from "@/features/customer/account/use-display-name";
import { releasePushToken } from "@/features/customer/push/registry";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProfileEditSheet } from "@/components/ProfileEditSheet";
import { AuthView } from "@/components/auth/AuthView";
import { env } from "@/lib/env";
import { setAppLanguage, type AppLanguage } from "@/lib/i18n";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INK = "#1f2a2e";
const PRIMARY = "#3c5a64";
const ANDROID_PACKAGE = "com.skirana.app";

// The language switch - one row for both the signed-in settings card and the
// signed-out one, so the two can never drift apart. It owns its own open
// state and its own हिंदी/English labels.
const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: "hi", label: "हिंदी" },
  { code: "en", label: "English" },
];

function LanguageRow() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((option) => option.code === i18n.language);

  return (
    <>
      <MenuRow
        icon={<Feather name="globe" size={18} color={INK} />}
        title={t("common.language")}
        subtitle={current?.label}
        onPress={() => setOpen((value) => !value)}
      />
      {open ? (
        <View className="gap-2 border-b border-border/60 px-4 pb-4">
          <Text className="text-lg font-semibold text-foreground">
            {t("common.language")}
          </Text>
          <View className="flex-row gap-2">
            {LANGUAGES.map((option) => {
              const active = i18n.language === option.code;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => void setAppLanguage(option.code)}
                  className={cn(
                    "flex-1 items-center rounded-xl border py-3",
                    active
                      ? "border-primary bg-primary"
                      : "border-border bg-card",
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
      ) : null}
    </>
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
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = useCustomerGroceryListStore((state) => state.items);
  const customerPhone = useCustomerGroceryListStore(
    (state) => state.customerPhone,
  );
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);
  // Shared with the Home header's avatar, so an edit here shows there at once.
  const profile = useCustomerAccountStore((state) => state.profile);
  const loadProfile = useCustomerAccountStore((state) => state.loadProfile);
  const setProfile = useCustomerAccountStore((state) => state.setProfile);
  const displayName = useCustomerDisplayName();

  // Keep the counters and the saved details fresh whenever the tab is opened.
  useFocusEffect(
    useCallback(() => {
      if (!isSignedIn) return;
      void loadLists();
      void loadProfile();
    }, [isSignedIn, loadLists, loadProfile]),
  );

  // Hand this device's push token back before the session ends, so the next
  // person to use the phone doesn't get this customer's order alerts.
  const signOutFully = async () => {
    await releasePushToken();
    await signOut();
  };

  const saveProfile = async (values: { name: string; phone?: string }) => {
    try {
      setSaving(true);
      const updated = await updateCustomerProfile(values);
      setProfile(updated);
      setEditOpen(false);
      toast.success(t("account.profileSaved"));
      // Lists carry the customer's phone, so refresh what the screen shows.
      void loadLists();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("common.somethingWrong"),
      );
    } finally {
      setSaving(false);
    }
  };

  // Signed out: the login itself, right here - no extra "Log in" button to
  // tap first. Settings that work without an account (language, terms) sit
  // below it, apart from the login choices.
  if (!isSignedIn) {
    return (
      <AuthView
        onDone={() => {}}
        header={
          <Text className="pb-4 pt-3 text-2xl font-bold text-foreground">
            {t("tabs.account")}
          </Text>
        }
        footer={
          <View className="gap-3">
            <Text className="px-1 text-sm font-bold text-muted-foreground">
              {t("account.settings")}
            </Text>
            <View className="overflow-hidden rounded-2xl border border-border bg-card">
              <LanguageRow />
              <MenuRow
                icon={<Feather name="file-text" size={18} color={INK} />}
                title={t("account.terms")}
                onPress={() => navigation.navigate("Legal")}
                last
              />
            </View>
          </View>
        }
      />
    );
  }

  // Prefer the saved profile (what the shop actually sees on an order) and
  // fall back to Clerk / the lists store until it loads.
  const name = displayName ?? (t("account.customer") as string);
  const emailAddress =
    profile?.email || user?.primaryEmailAddress?.emailAddress || "";
  const phone = profile?.phone || customerPhone || "";

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
      ? t("account.monthsValue", { count: months })
      : t("account.daysValue", { count: days });

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
        <ProfileAvatar name={name} size={56} />
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
        <Pressable
          onPress={() => setEditOpen(true)}
          hitSlop={8}
          className="flex-row items-center gap-1.5 rounded-full bg-card px-3 py-2"
        >
          <Feather name="edit-2" size={13} color={PRIMARY} />
          <Text className="text-xs font-bold text-primary">
            {t("account.editProfile")}
          </Text>
        </Pressable>
      </View>

      {/* My details */}
      <View className="overflow-hidden rounded-2xl border border-border bg-card">
        <Text className="border-b border-border px-4 py-3 text-sm font-bold text-foreground">
          {t("account.myDetails")}
        </Text>
        <InfoRow
          icon={<Feather name="smartphone" size={16} color={PRIMARY} />}
          label={t("account.mobile")}
          value={phone || t("account.notAdded")}
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
        <LanguageRow />
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
        onPress={() => void signOutFully()}
        className="items-center rounded-2xl border border-destructive/40 bg-card py-3.5"
      >
        <Text className="text-base font-semibold text-destructive">
          {t("account.signOut")}
        </Text>
      </Pressable>

      <ProfileEditSheet
        open={editOpen}
        submitting={saving}
        initialName={profile?.name || user?.fullName || ""}
        initialPhone={phone}
        onClose={() => setEditOpen(false)}
        onSubmit={(values) => void saveProfile(values)}
      />
    </ScrollView>
  );
}
