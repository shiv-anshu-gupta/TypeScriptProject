/**
 * The Lists tab: sent orders and the unsent draft.
 *
 * @packageDocumentation
 */

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
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import type { RootStackParamList, TabParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import {
  ACTIVE_STATUSES,
  type CustomerGroceryList,
  type GroceryListStatus,
} from "@/features/customer/grocery-list/types";
import {
  countSendableRows,
  useDraftListStore,
} from "@/features/customer/draft-list/store";
import { Button } from "@/components/ui/Button";
import { AuthView } from "@/components/auth/AuthView";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/lib/toast";
import { GroceryList } from "@/components/GroceryList";
import { ChatSheet } from "@/components/ChatSheet";
import { OrderStepper } from "@/components/OrderStepper";
import { formatPrice } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// If the shop hasn't priced a list within this many minutes, reassure the
// customer that the shop is just busy (not ignoring them). Purely time-based —
// computed from the list's age, no backend or shopkeeper action needed.
const BUSY_AFTER_MIN = 30;

// How many lines of a sent list show before "Show N more".
const PREVIEW_ITEMS = 3;

/**
 * "3 Oct" from an ISO date, with month names from the current language.
 *
 * @remarks
 * Built by hand rather than with `Intl`, whose locale data varies between
 * Android builds; `months` is the translated, comma-separated list.
 */
function formatShortDate(iso: string, months: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const names = months.split(",");
  return `${date.getDate()} ${names[date.getMonth()] ?? ""}`.trim();
}

// Status tabs so cancelled / completed lists don't clutter the active ones.
const STATUS_TABS = ["active", "completed", "cancelled"] as const;
type StatusTab = (typeof STATUS_TABS)[number];
const STATUS_GROUPS: Record<StatusTab, GroceryListStatus[]> = {
  // The same statuses the Home card counts as in progress, from one place, so
  // "+N more orders in progress" can never disagree with this tab.
  active: [...ACTIVE_STATUSES],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

/**
 * One sent order: its items, the total once priced, its progress, a way to
 * message the shop, and payment buttons when there is something to pay.
 *
 * @remarks
 * It marks the order seen on mount, but only while the tab is focused. This
 * tab stays mounted in the background, so without that guard a shop update
 * would be cleared from the badge while the customer was on another tab and
 * never saw it.
 *
 * It subscribes to only its own busy flag rather than the whole store, because
 * subscribing broadly re-renders every card and every card's chat sheet on any
 * change. The action functions are read once from the store rather than
 * subscribed to.
 *
 * It mounts a {@link ChatSheet} per order, which polls only while open.
 *
 * Two rules are deliberate. Items may be removed only before the shop starts
 * packing, never after payment and never the last one; removal is by position,
 * so one removal at a time and the position is re-read when the customer
 * confirms, not when the alert opened. Payment appears only when the order is
 * priced and still live — a cancelled or completed order must never ask for
 * money again.
 *
 * "The shop is busy" after a wait is computed purely from the order's age.
 * There is no backend field and no shopkeeper action behind it.
 */
function ListCard({ list }: { list: CustomerGroceryList }) {
  const { t } = useTranslation();
  // This tab stays mounted in the background, so without this a shop update
  // would be marked "seen" (clearing the badge and the New update pill) while
  // the customer is on another tab and never saw it.
  const isFocused = useIsFocused();
  const [chatOpen, setChatOpen] = useState(false);
  // Only this card's own "am I busy" flag: subscribing to the whole store
  // re-renders every card (and its chat sheet) on any list change.
  const busy = useCustomerGroceryListStore(
    (state) => state.payingListId === list._id,
  );
  const { markSeen, payAtShop, payViaUpi, removeItem, cancelList } =
    useCustomerGroceryListStore.getState();

  const isPriced = list.totalAmount > 0;
  const isPaid = list.paymentStatus === "paid";
  const isLive = (ACTIVE_STATUSES as readonly string[]).includes(list.status);

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

  // The customer can withdraw the whole order until the shop starts packing.
  // Paid ones too - being unable to cancel after paying is the trap the
  // consumer rules exist for - and the dialog says the money comes back.
  const canCancel = list.status === "received" || list.status === "priced";
  const [cancelling, setCancelling] = useState(false);
  const confirmCancel = () => {
    if (cancelling) return;
    Alert.alert(
      t("lists.cancelTitle"),
      isPaid
        ? t("lists.cancelBodyPaid", { amount: formatPrice(list.totalAmount) })
        : t("lists.cancelBody"),
      [
        { text: t("lists.cancelKeep"), style: "cancel" },
        {
          text: t("lists.cancelConfirm"),
          style: "destructive",
          onPress: () => {
            setCancelling(true);
            void cancelList(list._id).finally(() => setCancelling(false));
          },
        },
      ],
    );
  };

  // Removing goes by position, and every removal shifts the positions after
  // it. So only one removal may be in flight, and the position is re-read from
  // the list as it stands when the customer confirms - not as it was when the
  // alert opened.
  const [removing, setRemoving] = useState(false);

  const confirmRemove = (index: number, name: string) => {
    if (removing) return;
    Alert.alert(t("lists.removeTitle"), t("lists.removeConfirm", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.remove"),
        style: "destructive",
        onPress: () => {
          const current = list.items[index];
          if (!current || current.name !== name) {
            // The list changed while the question was on screen.
            toast.error(t("common.somethingWrong"));
            return;
          }
          setRemoving(true);
          void removeItem(list._id, index).finally(() => setRemoving(false));
        },
      },
    ]);
  };

  useEffect(() => {
    if (isFocused && !list.seenByCustomer) {
      void markSeen(list._id);
    }
  }, [isFocused, list._id, list.seenByCustomer, markSeen]);

  // Long lists stay short until asked: the first few lines, then a toggle.
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? list.items : list.items.slice(0, PREVIEW_ITEMS);
  const hiddenCount = list.items.length - visibleItems.length;
  const isCancelled = list.status === "cancelled";

  // One sentence under the stepper says what is happening right now, which
  // is where "packing" and "packed" - one step - are told apart.
  const caption = shopBusy
    ? t("lists.busy")
    : list.status === "priced" && isPaid
      ? t("lists.caption.pricedPaid")
      : t(`lists.caption.${list.status}`);

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header: which order, when, and - once priced - how much */}
      <View className="flex-row items-start justify-between gap-3 px-4 pb-3 pt-4">
        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-base font-bold text-foreground">
              #{list.code}
            </Text>
            {!list.seenByCustomer ? (
              <View className="rounded-full bg-primary px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-primary-foreground">
                  {t("lists.newUpdate")}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {formatShortDate(list.createdAt, t("lists.monthsShort"))} ·{" "}
            {t("lists.itemsCount", { count: list.totalItems })}
          </Text>
        </View>
        {isPriced && !isCancelled ? (
          <View className="items-end">
            <Text className="text-lg font-bold text-foreground">
              {formatPrice(list.totalAmount)}
            </Text>
            <Text
              className={
                isPaid
                  ? "text-[10px] font-semibold text-success"
                  : "text-[10px] text-muted-foreground"
              }
            >
              {isPaid ? t("lists.paidShort") : t("lists.estimateShort")}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Status: the stepper, or a plain banner when cancelled */}
      <View className="gap-2 px-4">
        {isCancelled ? (
          <View className="flex-row items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3">
            <Feather name="x-circle" size={16} color="#c0492f" />
            <Text className="text-sm font-semibold text-destructive">
              {t("lists.caption.cancelled")}
            </Text>
          </View>
        ) : (
          <>
            <OrderStepper status={list.status} />
            <Text className="text-xs leading-5 text-muted-foreground">
              {caption}
            </Text>
          </>
        )}
      </View>

      {/* Items - price column only once the shop has priced it */}
      <View className="mx-4 mt-3 border-t border-border">
        {visibleItems.map((item, index) => (
          <View
            key={`${list._id}-${index}`}
            className="flex-row items-center gap-3 border-b border-border/60 py-2.5"
          >
            <Text
              className={
                item.available === false
                  ? "flex-1 text-sm text-muted-foreground line-through"
                  : "flex-1 text-sm text-foreground"
              }
              numberOfLines={2}
            >
              {item.name}
              {item.quantity ? (
                <Text className="text-muted-foreground"> · {item.quantity}</Text>
              ) : null}
            </Text>
            {item.available === false ? (
              <Text className="text-xs font-semibold text-destructive">
                {t("lists.notAvailable")}
              </Text>
            ) : isPriced ? (
              <View className="items-end">
                <Text className="text-sm font-semibold text-foreground">
                  {formatPrice(item.price)}
                </Text>
                {item.rate ? (
                  <Text className="text-[10px] text-muted-foreground">
                    @{formatPrice(item.rate)}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {canRemoveItems ? (
              <Pressable
                onPress={() => confirmRemove(index, item.name)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${t("common.delete")} ${item.name}`}
                className="h-7 w-7 items-center justify-center rounded-full border border-destructive/30"
              >
                <Feather name="trash-2" size={13} color="#c0492f" />
              </Pressable>
            ) : null}
          </View>
        ))}
        {list.items.length > PREVIEW_ITEMS ? (
          <Pressable
            onPress={() => setExpanded((value) => !value)}
            accessibilityRole="button"
            className="flex-row items-center justify-center gap-1 py-2.5"
          >
            <Text className="text-xs font-semibold text-primary">
              {expanded
                ? t("lists.showLess")
                : t("lists.showMore", { count: hiddenCount })}
            </Text>
            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={14}
              color="#3c5a64"
            />
          </Pressable>
        ) : null}
      </View>

      {/* Total, with the estimate note right under it */}
      {isPriced && !isCancelled ? (
        <View className="mx-4 mt-3 gap-1 rounded-xl bg-secondary px-4 py-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">
              {t("lists.total")}
            </Text>
            <Text className="text-lg font-bold text-foreground">
              {formatPrice(list.totalAmount)}
            </Text>
          </View>
          <Text className="text-[11px] leading-4 text-muted-foreground">
            {t("lists.estimate")}
          </Text>
        </View>
      ) : null}

      {/* Actions */}
      <View className="gap-2 px-4 pb-4 pt-3">
        {/* Payment - only once priced, and only while the order is still
            live: a cancelled or finished order must never ask for money. */}
        {isPriced && isLive ? (
          isPaid ? (
            <View className="flex-row items-center justify-center gap-2 rounded-xl bg-success/10 py-2.5">
              <Feather name="check-circle" size={15} color="#4f7a4d" />
              <Text className="text-sm font-semibold text-success">
                {t("lists.paymentReceived")}
              </Text>
            </View>
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

        {/* Talk to the shop, and - until packing starts - cancel */}
        <View className="flex-row items-center justify-between pt-1">
          <Pressable
            onPress={() => setChatOpen(true)}
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-full border border-border bg-secondary px-3.5 py-2"
          >
            <Feather name="message-circle" size={14} color="#3c5a64" />
            <Text className="text-xs font-semibold text-foreground">
              {t("lists.messageShop")}
            </Text>
          </Pressable>
          {canCancel ? (
            <Pressable
              onPress={confirmCancel}
              disabled={cancelling}
              accessibilityRole="button"
              hitSlop={6}
              className="px-2 py-2"
            >
              <Text className="text-xs font-semibold text-destructive">
                {cancelling ? "…" : t("lists.cancelOrder")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ChatSheet
        open={chatOpen}
        listId={list._id}
        code={list.code}
        onClose={() => setChatOpen(false)}
      />
    </View>
  );
}

/**
 * The unsent draft, in a dashed card above the sent orders.
 *
 * @remarks
 * The customer's not-yet-sent draft (built on the Home paper and/or via
 * "Add to list" on products). Shown here as the SAME editable paper as Home,
 * so items can be edited / added / removed and sent without going back Home.
 *
 * Renders nothing when the draft is empty, so the screen does not show an
 * empty page of paper.
 */
function DraftCard() {
  const { t } = useTranslation();
  const filledCount = useDraftListStore((state) =>
    countSendableRows(state.rows),
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

/**
 * The customer's orders, split into Active, Completed and Cancelled, with
 * their unsent draft at the top of the Active tab.
 *
 * @remarks
 * Signed out it renders the login in place of its content — there is no route
 * guard anywhere in the app, each screen decides for itself.
 *
 * Signed in, it reloads the orders on every focus and on pull-to-refresh, and
 * reads the draft store to know whether to show the draft card. Filtering
 * between the three status tabs is local; nothing is re-fetched.
 *
 * It opens no sheet itself, but each order card mounts a chat sheet, and the
 * draft card carries the Send flow, which can open the phone prompt.
 *
 * The `tab` parameter is a one-shot hand-off from Home's journey card or a
 * just-sent list, so the order being pointed at is actually on screen. It is
 * cleared once applied, leaving the customer free to switch tabs afterwards.
 */
export function MyListsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { isSignedIn } = useAuth();

  const items = useCustomerGroceryListStore((state) => state.items);
  const loading = useCustomerGroceryListStore((state) => state.loading);
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);

  const hasDraft = useDraftListStore(
    (state) => countSendableRows(state.rows) > 0,
  );

  const [statusTab, setStatusTab] = useState<StatusTab>("active");

  // Home's journey card (and a just-sent list) ask for a particular tab, so
  // the order they point at is actually on screen. The request is cleared once
  // applied, leaving the customer free to switch tabs afterwards.
  const route = useRoute<RouteProp<TabParamList, "Lists">>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const requestedTab = route.params?.tab;
  useEffect(() => {
    if (!requestedTab) return;
    setStatusTab(requestedTab);
    tabNavigation.setParams({ tab: undefined });
  }, [requestedTab, tabNavigation]);
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

  // Signed out: log in right here, no extra button to tap first.
  if (!isSignedIn) {
    return (
      <AuthView
        onDone={() => {}}
        subtitle={t("lists.emptySignedOut")}
        header={
          <Text className="pb-4 pt-3 text-2xl font-bold text-foreground">
            {t("tabs.lists")}
          </Text>
        }
      />
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
        <RefreshControl
          refreshing={loading}
          onRefresh={() => void loadLists()}
        />
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
