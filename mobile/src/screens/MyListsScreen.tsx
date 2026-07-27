import { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import type {
  CustomerGroceryList,
  GroceryListStatus,
} from "@/features/customer/grocery-list/types";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useSendDraft } from "@/features/customer/draft-list/use-send-draft";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The customer-facing journey. "priced" is folded into the same step as
// "received" on the timeline — it just unlocks the total + payment.
const TIMELINE: { key: GroceryListStatus; label: string }[] = [
  { key: "received", label: "Received item list" },
  { key: "packing", label: "Packing" },
  { key: "packed", label: "Packed" },
  { key: "ready", label: "Come to receive" },
];

const STEP_INDEX: Record<GroceryListStatus, number> = {
  received: 0,
  priced: 0,
  packing: 1,
  packed: 2,
  ready: 3,
  completed: 3,
  cancelled: -1,
};

function StatusTimeline({ status }: { status: GroceryListStatus }) {
  const current = STEP_INDEX[status] ?? 0;

  if (status === "cancelled") {
    return (
      <Badge className="border-0 bg-destructive">
        <Text className="text-xs font-medium text-destructive-foreground">
          Cancelled
        </Text>
      </Badge>
    );
  }

  return (
    <View className="gap-2">
      {TIMELINE.map((step, index) => {
        const done = index <= current;
        return (
          <View key={step.key} className="flex-row items-center gap-3">
            <View
              className={
                done
                  ? "h-6 w-6 items-center justify-center rounded-full bg-primary"
                  : "h-6 w-6 items-center justify-center rounded-full border border-border bg-muted"
              }
            >
              {done ? (
                <Feather name="check" size={13} color="#fafafa" />
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
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ListCard({ list }: { list: CustomerGroceryList }) {
  const { markSeen, payAtShop, payViaUpi, payingListId } =
    useCustomerGroceryListStore((state) => state);

  const isPriced = list.totalAmount > 0;
  const isPaid = list.paymentStatus === "paid";
  const busy = payingListId === list._id;

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
            List #{list.code}
          </Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {list.totalItems} item{list.totalItems > 1 ? "s" : ""}
          </Text>
        </View>
        {!list.seenByCustomer ? (
          <Badge className="border-0 bg-primary">
            <Text className="text-xs font-medium text-primary-foreground">
              New update
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
            <Text className="flex-1 text-sm text-foreground">
              {index + 1}. {item.name}
              {item.quantity ? (
                <Text className="text-muted-foreground"> · {item.quantity}</Text>
              ) : null}
            </Text>
            {isPriced ? (
              <Text className="text-sm font-medium text-foreground">
                {formatPrice(item.price)}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {isPriced ? (
        <View className="flex-row items-center justify-between border-t border-border pt-3">
          <Text className="text-base font-semibold text-foreground">Total</Text>
          <Text className="text-base font-semibold text-foreground">
            {formatPrice(list.totalAmount)}
          </Text>
        </View>
      ) : (
        <View className="rounded-xl border border-border bg-secondary p-3">
          <Text className="text-xs text-muted-foreground">
            Waiting for the shop to price your list.
          </Text>
        </View>
      )}

      <StatusTimeline status={list.status} />

      {/* Payment — only once priced */}
      {isPriced ? (
        isPaid ? (
          <Badge className="border-0 bg-success">
            <Text className="text-xs font-medium text-primary-foreground">
              Payment received
            </Text>
          </Badge>
        ) : (
          <View className="gap-2">
            <Button
              label={`Pay ${formatPrice(list.totalAmount)} via UPI`}
              loading={busy}
              onPress={() => void payViaUpi(list)}
            />
            <Button
              label="Pay at the shop"
              variant="outline"
              loading={busy}
              onPress={() => void payAtShop(list._id)}
            />
            <Text className="text-center text-[11px] text-muted-foreground">
              After paying, the shop confirms once the money arrives.
            </Text>
          </View>
        )
      ) : null}
    </View>
  );
}

// The customer's not-yet-sent draft (built on the Home paper and/or via
// "Add to list" on products). Shown here too, because after adding products
// from the Shop this is where people naturally come to send.
function DraftCard() {
  const { filledRows, submitting, send } = useSendDraft();

  if (!filledRows.length) return null;

  return (
    <View className="gap-3 rounded-2xl border border-dashed border-primary/40 bg-card p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Your new list
        </Text>
        <Badge className="border-0 bg-secondary">
          <Text className="text-xs font-medium text-foreground">Not sent</Text>
        </Badge>
      </View>

      <View className="gap-1.5">
        {filledRows.map((row, index) => (
          <Text key={row.id} className="text-sm text-foreground">
            {index + 1}. {row.name.trim()}
            {(row.quantity ?? "").trim() ? (
              <Text className="text-muted-foreground">
                {" "}
                · {row.quantity.trim()}
              </Text>
            ) : null}
          </Text>
        ))}
      </View>

      <Button
        label={`Send ${filledRows.length} item${filledRows.length > 1 ? "s" : ""} to shop`}
        loading={submitting}
        onPress={() => void send()}
      />
      <Text className="text-center text-[11px] text-muted-foreground">
        Add more from the Shop tab, or edit it on the Home paper.
      </Text>
    </View>
  );
}

export function MyListsScreen() {
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
        <Feather name="clipboard" size={40} color="#a1a1aa" />
        <Text className="text-center text-sm text-muted-foreground">
          Sign in to see the lists you've sent to the shop.
        </Text>
        <Button
          label="Sign in"
          onPress={() => navigation.navigate("SignIn")}
          className="w-full"
        />
      </View>
    );
  }

  if (loading && !items.length) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#18181b" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
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
    >
      <Text className="text-2xl font-semibold text-foreground">My lists</Text>

      <DraftCard />

      {!items.length && !hasDraft ? (
        <View className="mt-16 items-center gap-4">
          <Feather name="clipboard" size={40} color="#a1a1aa" />
          <Text className="text-center text-sm text-muted-foreground">
            You haven't sent any list yet. Write one on the home page.
          </Text>
          <Pressable onPress={() => navigation.navigate("Tabs", { screen: "Home" })}>
            <Text className="text-sm font-semibold text-foreground">
              Go to home
            </Text>
          </Pressable>
        </View>
      ) : (
        items.map((list) => <ListCard key={list._id} list={list} />)
      )}
    </ScrollView>
  );
}
