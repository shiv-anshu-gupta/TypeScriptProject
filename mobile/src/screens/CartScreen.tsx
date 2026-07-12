import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerCartAndCheckoutStore } from "@/features/customer/cart-and-checkout/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CartScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const signedIn = !!isSignedIn;

  const {
    cart,
    loading,
    addresses,
    selectedAddressId,
    points,
    promoInput,
    appliedPromo,
    promoLoading,
    checkoutLoading,
    pointsCheckoutLoading,
    loadCart,
    increase,
    decrease,
    remove,
    setPromoInput,
    applyPromo,
    setSelectedAddressId,
    startRazorpayCheckout,
    startPointsCheckout,
  } = useCustomerCartAndCheckoutStore((state) => state);

  useEffect(() => {
    void loadCart(signedIn);
  }, [signedIn, loadCart]);

  const totalItems = useMemo(
    () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
    [cart.items],
  );

  const onSuccess = () => navigation.navigate("Orders");

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-background"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator color="#18181b" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="border-b border-border px-4 pb-3 pt-2">
        <Text className="text-2xl font-semibold text-foreground">Your bag</Text>
        <Text className="text-sm text-muted-foreground">
          {cart.totalQuantity} item{cart.totalQuantity === 1 ? "" : "s"}
        </Text>
      </View>

      {cart.items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="shopping-bag" size={36} color="#a1a1aa" />
          <Text className="mt-3 text-center text-base text-muted-foreground">
            Your bag is empty.
          </Text>
          <View className="mt-4">
            <Button
              label="Start shopping"
              onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
            />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {cart.items.map((item) => {
              const identifier = {
                productId: item.productId,
                color: item.color,
                size: item.size,
              };
              return (
                <View
                  key={`${item.productId}-${item.color ?? ""}-${item.size ?? ""}`}
                  className="flex-row gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <View className="h-24 w-20 overflow-hidden rounded-lg bg-muted">
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1 justify-between">
                    <View>
                      <Text
                        numberOfLines={1}
                        className="text-sm font-medium text-foreground"
                      >
                        {item.title}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {[item.brand, item.color, item.size]
                          .filter(Boolean)
                          .join(" · ")}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3 rounded-full border border-border px-2 py-1">
                        <Pressable
                          onPress={() => decrease(identifier, signedIn)}
                          hitSlop={8}
                        >
                          <Feather name="minus" size={16} color="#18181b" />
                        </Pressable>
                        <Text className="w-6 text-center text-sm font-semibold text-foreground">
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() => increase(identifier, signedIn)}
                          hitSlop={8}
                        >
                          <Feather name="plus" size={16} color="#18181b" />
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() => remove(identifier, signedIn)}
                        hitSlop={8}
                      >
                        <Feather name="trash-2" size={18} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* Promo */}
            <View className="mt-2 flex-row items-center gap-2">
              <TextInput
                value={promoInput}
                onChangeText={setPromoInput}
                placeholder="Promo code"
                autoCapitalize="characters"
                placeholderTextColor="#a1a1aa"
                className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-foreground"
              />
              <Button
                label="Apply"
                variant="secondary"
                loading={promoLoading}
                onPress={applyPromo}
              />
            </View>

            {/* Addresses (signed-in) */}
            {signedIn ? (
              <View className="mt-2 gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  Deliver to
                </Text>
                {addresses.length === 0 ? (
                  <Text className="text-sm text-muted-foreground">
                    No address yet — add one from the Account tab.
                  </Text>
                ) : (
                  addresses.map((address) => (
                    <Pressable
                      key={address._id}
                      onPress={() => setSelectedAddressId(address._id)}
                      className={
                        selectedAddressId === address._id
                          ? "rounded-xl border-2 border-primary bg-card p-3"
                          : "rounded-xl border border-border bg-card p-3"
                      }
                    >
                      <Text className="text-sm font-medium text-foreground">
                        {address.fullName}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {address.address}, {address.state} {address.postalCode}
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            ) : null}
          </ScrollView>

          {/* Summary + checkout */}
          <View className="gap-2 border-t border-border px-4 pb-8 pt-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">Total items</Text>
              <Text className="text-sm font-semibold text-foreground">
                {totalItems}
              </Text>
            </View>

            <View className="rounded-xl border border-border bg-secondary p-3">
              <Text className="text-xs leading-5 text-muted-foreground">
                No prices yet — the shop will review your list and send back the
                item prices and total. You pay after you accept the quote.
              </Text>
            </View>

            {signedIn ? (
              <View className="mt-1 gap-2">
                <Button
                  label="Place order"
                  loading={checkoutLoading}
                  onPress={() =>
                    startRazorpayCheckout({
                      isSignedIn: signedIn,
                      name: user?.fullName ?? "Customer",
                      email:
                        user?.primaryEmailAddress?.emailAddress ?? "",
                      onSuccess,
                    })
                  }
                />
                <Button
                  label={`Pay with points (${points} pts)`}
                  variant="outline"
                  loading={pointsCheckoutLoading}
                  onPress={() =>
                    startPointsCheckout({ isSignedIn: signedIn, onSuccess })
                  }
                />
              </View>
            ) : (
              <View className="mt-1">
                <Button
                  label="Sign in to checkout"
                  onPress={() => navigation.navigate("SignIn")}
                />
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}
