/**
 * The saved products screen.
 *
 * @packageDocumentation
 */

import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerWishlistStore } from "@/features/customer/wishlist/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * The products the customer has hearted, as a list they can open or remove
 * from.
 *
 * @remarks
 * Pushed from the Account tab's "Saved products" row. Reads
 * `useCustomerWishlistStore` and loads it on mount when signed in, not on
 * focus — this is a pushed screen, not a tab, so it is mounted fresh each
 * time.
 *
 * Three states: a message when signed out, a message when empty, or the list.
 * Signed out it shows a message rather than the login, unlike the Lists and
 * Account tabs, because nothing here is worth signing in for on its own.
 *
 * Removing is immediate, with no confirmation, since it is reversible from the
 * product page. It opens no sheets and reads nothing else.
 */
export function WishlistScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { isSignedIn } = useAuth();
  const { items, loadWishlist, removeItem } = useCustomerWishlistStore(
    (state) => state,
  );

  useEffect(() => {
    if (isSignedIn) void loadWishlist();
  }, [isSignedIn, loadWishlist]);

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Feather name="heart" size={32} color="#ada291" />
        <Text className="mt-3 text-center text-base text-muted-foreground">
          {t("wishlist.signedOut")}
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Feather name="heart" size={32} color="#ada291" />
        <Text className="mt-3 text-center text-base text-muted-foreground">
          {t("wishlist.empty")}
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
      {items.map((item) => (
        <Pressable
          key={item.productId}
          onPress={() =>
            navigation.navigate("ProductDetails", { productId: item.productId })
          }
          className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3"
        >
          <View className="h-20 w-16 overflow-hidden rounded-lg bg-muted">
            <Image
              source={{ uri: item.image }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </View>
          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-sm font-medium text-foreground"
            >
              {item.title}
            </Text>
            <Text className="text-xs text-muted-foreground">{item.brand}</Text>
          </View>
          <Pressable onPress={() => removeItem(item.productId)} hitSlop={8}>
            <Feather name="trash-2" size={18} color="#c0492f" />
          </Pressable>
        </Pressable>
      ))}
    </ScrollView>
  );
}
