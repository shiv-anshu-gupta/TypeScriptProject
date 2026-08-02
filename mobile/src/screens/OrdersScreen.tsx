import { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

import { useCustomerOrdersStore } from "@/features/customer/orders/store";
import type { CustomerOrderStatus } from "@/features/customer/orders/types";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const statusColor: Record<CustomerOrderStatus, string> = {
  placed: "bg-secondary",
  shipped: "bg-secondary",
  delivered: "bg-secondary",
  returned: "bg-secondary",
};

export function OrdersScreen() {
  const { isSignedIn } = useAuth();
  const { items, loading, loadOrders, returnOrder } = useCustomerOrdersStore(
    (state) => state,
  );

  useEffect(() => {
    if (isSignedIn) void loadOrders();
  }, [isSignedIn, loadOrders]);

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Feather name="package" size={32} color="#94a6ac" />
        <Text className="mt-3 text-center text-base text-muted-foreground">
          Sign in to view your orders.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3c5a64" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Feather name="package" size={32} color="#94a6ac" />
        <Text className="mt-3 text-center text-base text-muted-foreground">
          You have no orders yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {items.map((order) => (
        <View
          key={order._id}
          className="gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">
              #{order.code}
            </Text>
            <Badge className={statusColor[order.orderStatus]}>
              {order.orderStatus}
            </Badge>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-muted-foreground">
              {order.totalItems} item{order.totalItems === 1 ? "" : "s"} ·{" "}
              {order.paymentStatus}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatPrice(order.totalAmount)}
            </Text>
          </View>
          {order.orderStatus === "delivered" ? (
            <Button
              label="Return order"
              variant="outline"
              size="sm"
              onPress={() => returnOrder(order._id)}
            />
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}
