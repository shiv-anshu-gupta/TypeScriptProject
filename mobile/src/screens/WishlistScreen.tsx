import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerWishlistStore } from "@/features/customer/wishlist/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function WishlistScreen() {
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
        <Feather name="heart" size={32} color="#94a6ac" />
        <Text className="mt-3 text-center text-base text-muted-foreground">
          Sign in to view your saved items.
        </Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Feather name="heart" size={32} color="#94a6ac" />
        <Text className="mt-3 text-center text-base text-muted-foreground">
          Your wishlist is empty.
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
            <Feather name="trash-2" size={18} color="#dc2626" />
          </Pressable>
        </Pressable>
      ))}
    </ScrollView>
  );
}
