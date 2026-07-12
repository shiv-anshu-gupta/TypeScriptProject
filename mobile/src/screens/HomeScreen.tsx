import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerHomeStore } from "@/features/customer/home/store";
import { ProductCard } from "@/components/ProductCard";
import { GroceryList } from "@/components/GroceryList";
import { formatPrice } from "@/lib/utils";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { data, loading, loadHome } = useCustomerHomeStore((state) => state);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#18181b" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <GroceryList />

      {/* Categories */}
      {data.categories.length ? (
        <View className="mt-8 px-4">
          <Text className="mb-3 text-lg font-semibold text-foreground">
            Browse by collection
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {data.categories.slice(0, 6).map((category) => (
              <Pressable
                key={category._id}
                onPress={() =>
                  navigation.navigate("Tabs", {
                    screen: "Shop",
                    params: { category: category._id },
                  })
                }
                className="flex-row items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5"
              >
                <Feather name="tag" size={14} color="#18181b" />
                <Text className="text-sm font-medium text-foreground">
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Coupons */}
      {data.coupons.length ? (
        <View className="mt-8 px-4">
          <Text className="mb-3 text-lg font-semibold text-foreground">
            Offers for you
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {data.coupons.map((coupon) => (
              <View
                key={coupon._id}
                className="w-56 gap-2 rounded-2xl border border-dashed border-primary/30 bg-secondary p-4"
              >
                <View className="flex-row items-center gap-2">
                  <Feather name="percent" size={16} color="#18181b" />
                  <Text className="text-xl font-bold tracking-widest text-foreground">
                    {coupon.code}
                  </Text>
                </View>
                <Text className="text-sm text-muted-foreground">
                  {coupon.percentage}% off over{" "}
                  {formatPrice(coupon.minimumOrderValue)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Recent products */}
      {data.recentProducts.length ? (
        <View className="mt-8 px-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">
              New arrivals
            </Text>
            <Pressable
              onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
            >
              <Text className="text-sm font-semibold text-foreground">
                View all
              </Text>
            </Pressable>
          </View>
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {data.recentProducts.map((product) => (
              <View key={product._id} style={{ width: "48%" }}>
                <ProductCard
                  product={{
                    id: product._id,
                    title: product.title,
                    brand: product.brand,
                    image: product.image,
                    unit: product.unit,
                  }}
                  onPress={() =>
                    navigation.navigate("ProductDetails", {
                      productId: product._id,
                    })
                  }
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
