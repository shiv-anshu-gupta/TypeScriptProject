import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import type {
  CustomerGroceryList,
  GroceryListStatus,
} from "@/features/customer/grocery-list/types";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GroceryList } from "@/components/GroceryList";
import { ChatSheet } from "@/components/ChatSheet";
import { formatPrice } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// If the shop hasn't priced a list within this many minutes, reassure the
// customer that the shop is just busy (not ignoring them). Purely time-based —
// computed from the list's age, no backend or shopkeeper action needed.
const BUSY_AFTER_MIN = 30;

// Status tabs so cancelled / completed lists don't clutter the active ones.
const STATUS_TABS = ["active", "completed", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];
const STATUS_GROUPS: Record<StatusTab, GroceryListStatus[]> = {
  active: ["received", "priced", "packing", "packed", "ready"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

// The customer-facing journey. "Priced" is its own visible step so the
// customer sees the quote arrive — its label carries the total. Labels are
// translated at render via lists.timeline.<key>.
const TIMELINE_KEYS: GroceryListStatus[] = [
  "received",
  "priced",
  "packing",
  "packed",
  "ready",
];

const STEP_INDEX: Record<GroceryListStatus, number> = {
  received: 0,
  priced: 1,
  packing: 2,
  packed: 3,
  ready: 4,
  completed: 4,
  cancelled: -1,
};

function StatusTimeline({ list }: { list: CustomerGroceryList }) {
  const { t } = useTranslation();
  const status = list.status;
  const current = STEP_INDEX[status] ?? 0;

  if (status === "cancelled") {
    return (
      <Badge className="border-0 bg-destructive">
        <Text className="text-xs font-medium text-destructive-foreground">
          {t("lists.cancelled")}
        </Text>
      </Badge>
    );
  }

  return (
    <View className="gap-2">
      {TIMELINE_KEYS.map((key, index) => {
        const done = index <= current;
        const base = t(`lists.timeline.${key}`);
        // The "Priced" step shows the quoted total right on the timeline.
        const label =
          key === "priced" && list.totalAmount > 0
            ? `${base} — ${formatPrice(list.totalAmount)}`
            : base;

        return (
          <View key={key} className="flex-row items-center gap-3">
            <View
              className={
                done
                  ? "h-6 w-6 items-center justify-center rounded-full bg-primary"
                  : "h-6 w-6 items-center justify-center rounded-full border border-border bg-muted"
              }
            >
              {done ? (
                <Feather name="check" size={13} color="#ffffff" />
              ) : (
                <View className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              )}
            </View>
            <Text
              className={
                done
                  ? "text-sm font-medium text-foreground"
                  : "text-sm text-muted-foreground"
              }
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ListCard({ list }: { list: CustomerGroceryList }) {
  const { t } = useTranslation();
  const [chatOpen, setChatOpen] = useState(false);
  const { markSeen, payAtShop, payViaUpi, payingListId, removeItem } =
    useCustomerGroceryListStore((state) => state);

  const isPriced = list.totalAmount > 0;
  const isPaid = list.paymentStatus === "paid";
  const busy = payingListId === list._id;

  // Still "received" (not priced) after BUSY_AFTER_MIN minutes → show the shop
  // a friendly "we're busy, hang tight" note instead of a blank wait.
  const waitedMinutes =
    (Date.now() - new Date(list.createdAt).getTime()) / 60000;
  const shopBusy =
    list.status === "received" && waitedMinutes >= BUSY_AFTER_MIN;

  // Over budget after the quote? Items can be removed — but only before the
  // shop starts packing, never after payment, and never the last item.
  const canRemoveItems =
    (list.status === "received" || list.status === "priced") &&
    !isPaid &&
    list.items.length > 1;

  const confirmRemove = (index: number, name: string) => {
    Alert.alert(t("lists.removeTitle"), t("lists.removeConfirm", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.remove"),
        style: "destructive",
        onPress: () => void removeItem(list._id, index),
      },
    ]);
  };

  useEffect(() => {
    if (!list.seenByCustomer) {
      void markSeen(list._id);
    }
  }, [list._id, list.seenByCustomer, markSeen]);

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("lists.listNo", { code: list.code })}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {t("lists.itemsCount", { count: list.totalItems })}
          </Text>
        </View>
        {!list.seenByCustomer ? (
          <Badge className="border-0 bg-primary">
            <Text className="text-xs font-medium text-primary-foreground">
              {t("lists.newUpdate")}
            </Text>
          </Badge>
        ) : null}
      </View>

      {/* Items — price column only once the shop has priced it */}
      <View className="gap-1.5">
        {list.items.map((item, index) => (
          <View
            key={`${list._id}-${index}`}
            className="flex-row items-center justify-between"
          >
            <Text
              className={
                item.available === false
                  ? "flex-1 text-sm text-muted-foreground line-through"
                  : "flex-1 text-sm text-foreground"
              }
            >
              {index + 1}. {item.name}
              {item.quantity ? (
                <Text className="text-muted-foreground"> · {item.quantity}</Text>
              ) : null}
            </Text>
            {item.available === false ? (
              <Text className="text-xs font-semibold text-destructive">
                {t("lists.notAvailable")}
              </Text>
            ) : isPriced ? (
              <View className="flex-row items-center gap-1.5">
                {item.rate ? (
                  <Text className="text-[11px] text-muted-foreground">
                    @{formatPrice(item.rate)}
                  </Text>
                ) : null}
                <Text className="text-sm font-medium text-foreground">
                  {formatPrice(item.price)}
                </Text>
              </View>
            ) : null}
            {canRemoveItems ? (
              <Pressable
                onPress={() => confirmRemove(index, item.name)}
                hitSlop={8}
                className="ml-3 rounded-md border border-destructive/40 px-2 py-0.5"
              >
                <Text className="text-xs font-semibold text-destructive">
                  {t("common.delete")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {isPriced ? (
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between rounded-xl bg-secondary px-4 py-3">
            <Text className="text-base font-semibold text-foreground">
              {t("lists.total")}
            </Text>
            <Text className="text-xl font-bold text-foreground">
              {formatPrice(list.totalAmount)}
            </Text>
          </View>
          {/* Passive legal note — an estimate; final bill is at the counter */}
          <Text className="text-center text-[11px] text-muted-foreground">
            {t("lists.estimate")}
          </Text>
        </View>
      ) : (
        <View
          className={
            shopBusy
              ? "rounded-xl border border-primary/30 bg-secondary p-3"
              : "rounded-xl border border-border bg-secondary p-3"
          }
        >
          <Text className="text-xs leading-5 text-muted-foreground">
            {shopBusy ? t("lists.busy") : t("lists.waiting")}
          </Text>
        </View>
      )}

      <StatusTimeline list={list} />

      {/* Talk to the shop about this order (quantities, packing, price…) */}
      <Pressable
        onPress={() => setChatOpen(true)}
        className="flex-row items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3"
      >
        <Feather name="message-circle" size={16} color="#3c5a64" />
        <Text className="text-sm font-semibold text-foreground">
          {t("lists.messageShop")}
        </Text>
      </Pressable>

      {/* Payment — only once priced */}
      {isPriced ? (
        isPaid ? (
          <Badge className="border-0 bg-success">
            <Text className="text-xs font-medium text-primary-foreground">
              {t("lists.paymentReceived")}
            </Text>
          </Badge>
        ) : (
          <View className="gap-2">
            <Button
              label={t("lists.payUpi", {
                amount: formatPrice(list.totalAmount),
              })}
              loading={busy}
              onPress={() => void payViaUpi(list)}
            />
            <Button
              label={t("lists.payAtShop")}
              variant="outline"
              loading={busy}
              onPress={() => void payAtShop(list._id)}
            />
            <Text className="text-center text-[11px] text-muted-foreground">
              {t("lists.payNote")}
            </Text>
          </View>
        )
      ) : null}

      <ChatSheet
        open={chatOpen}
        listId={list._id}
        code={list.code}
        onClose={() => setChatOpen(false)}
      />
    </View>
  );
}

// The customer's not-yet-sent draft (built on the Home paper and/or via
// "Add to list" on products). Shown here as the SAME editable paper as Home,
// so items can be edited / added / removed and sent without going back Home.
function DraftCard() {
  const { t } = useTranslation();
  const filledCount = useDraftListStore(
    (state) =>
      state.rows.filter((row) => (row.name ?? "").trim().length > 0).length,
  );

  if (!filledCount) return null;

  return (
    <View className="gap-2 rounded-2xl border border-dashed border-primary/40 bg-card py-3">
      <View className="flex-row items-center justify-between px-3">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("lists.newListLabel")}
        </Text>
        <Badge className="border-0 bg-secondary">
          <Text className="text-xs font-medium text-foreground">
            {t("lists.notSent")}
          </Text>
        </Badge>
      </View>

      {/* Same editable draft "paper" used on Home — edit names/quantities,
          add more lines, and send, all from the Lists screen. */}
      <GroceryList />
    </View>
  );
}

export function MyListsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { isSignedIn } = useAuth();

  const { items, loading, loadLists } = useCustomerGroceryListStore(
    (state) => state,
  );

  const hasDraft = useDraftListStore(
    (state) =>
      state.rows.filter((row) => (row.name ?? "").trim().length > 0).length > 0,
  );

  const [statusTab, setStatusTab] = useState<StatusTab>("active");
  const visibleItems = items.filter((list) =>
    STATUS_GROUPS[statusTab].includes(list.status),
  );

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        void loadLists();
      }
    }, [isSignedIn, loadLists]),
  );

  if (!isSignedIn) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-background px-8"
        style={{ paddingTop: insets.top }}
      >
        <MaterialCommunityIcons name="notebook" size={44} color="#ada291" />
        <Text className="text-center text-sm text-muted-foreground">
          {t("lists.emptySignedOut")}
        </Text>
        <Button
          label={t("common.signIn")}
          onPress={() => navigation.navigate("SignIn")}
          className="w-full"
        />
      </View>
    );
  }

  if (loading && !items.length) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3c5a64" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      data={visibleItems}
      keyExtractor={(list) => list._id}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 32,
        paddingHorizontal: 16,
        gap: 12,
      }}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => void loadLists()} />
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <View className="gap-3">
          <Text className="text-2xl font-semibold text-foreground">
            {t("lists.title")}
          </Text>

          {/* Status tabs — keep cancelled / completed out of the active view */}
          <View className="flex-row gap-2">
            {STATUS_TABS.map((tab) => {
              const active = statusTab === tab;
              const count = items.filter((l) =>
                STATUS_GROUPS[tab].includes(l.status),
              ).length;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setStatusTab(tab)}
                  className={
                    active
                      ? "rounded-full bg-primary px-3 py-1.5"
                      : "rounded-full border border-border bg-card px-3 py-1.5"
                  }
                >
                  <Text
                    className={
                      active
                        ? "text-xs font-semibold text-primary-foreground"
                        : "text-xs font-medium text-muted-foreground"
                    }
                  >
                    {t(`lists.tabs.${tab}`)}
                    {count ? ` ${count}` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {statusTab === "active" ? <DraftCard /> : null}
        </View>
      }
      ListEmptyComponent={
        statusTab !== "active" ? (
          <View className="mt-16 items-center gap-3">
            <MaterialCommunityIcons name="notebook" size={44} color="#ada291" />
            <Text className="text-center text-sm text-muted-foreground">
              {t("lists.emptyTab", { tab: t(`lists.tabs.${statusTab}`) })}
            </Text>
          </View>
        ) : !hasDraft ? (
          <View className="mt-16 items-center gap-4">
            <MaterialCommunityIcons name="notebook" size={44} color="#ada291" />
            <Text className="text-center text-sm text-muted-foreground">
              {t("lists.emptyNoLists")}
            </Text>
            <Pressable
              onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
            >
              <Text className="text-sm font-semibold text-foreground">
                {t("lists.goHome")}
              </Text>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => <ListCard list={item} />}
    />
  );
}
