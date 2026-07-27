import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import type { RootStackParamList, TabParamList } from "@/navigation/types";
import { useCustomerProductList } from "@/features/customer/products/use-customer-collections";
import { getCoverImage } from "@/features/customer/products/product-list.shared";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import type { ProductSort } from "@/features/customer/products/types";
import { ProductCard } from "@/components/ProductCard";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ShopRoute = RouteProp<TabParamList, "Shop">;

const sortOptions: { key: ProductSort; label: string }[] = [
  { key: "recent", label: "Newest" },
];

function Chip({
  label,
  active,
  onPress,
  swatch,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  swatch?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        active
          ? "flex-row items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2"
          : "flex-row items-center gap-2 rounded-full border border-border bg-card px-4 py-2"
      }
    >
      {swatch ? (
        <View
          style={{ backgroundColor: swatch }}
          className="h-3.5 w-3.5 rounded-full border border-border"
        />
      ) : null}
      <Text
        className={
          active
            ? "text-sm font-medium text-primary-foreground"
            : "text-sm font-medium text-foreground"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ShopScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ShopRoute>();
  const insets = useSafeAreaInsets();

  const {
    categories,
    products,
    loading,
    filters,
    sort,
    hasActiveFilters,
    changeSort,
    toggleFacet,
    clearFilters,
    activeFilterBadges,
  } = useCustomerProductList(route.params?.category);

  const draftCount = useDraftListStore(
    (state) =>
      state.rows.filter((row) => (row.name ?? "").trim().length > 0).length,
  );

  const resultLabel = useMemo(
    () => `${products.length} item${products.length === 1 ? "" : "s"}`,
    [products.length],
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="border-b border-border px-4 pb-3 pt-2">
        <Text className="text-2xl font-semibold text-foreground">Shop</Text>

        {/* Sort */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
        >
          {sortOptions.map((option) => (
            <Chip
              key={option.key}
              label={option.label}
              active={sort === option.key}
              onPress={() => changeSort(option.key)}
            />
          ))}
        </ScrollView>

        {/* Categories */}
        {categories.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          >
            {categories.map((category) => (
              <Chip
                key={category._id}
                label={category.name}
                active={filters.category === category._id}
                onPress={() => toggleFacet("category", category._id)}
              />
            ))}
          </ScrollView>
        ) : null}

        <View className="flex-row items-center justify-between pt-1">
          <Text className="text-sm text-muted-foreground">{resultLabel}</Text>
          {hasActiveFilters ? (
            <Pressable
              onPress={clearFilters}
              className="flex-row items-center gap-1"
            >
              <Feather name="x" size={14} color="#71717a" />
              <Text className="text-sm text-muted-foreground">
                Clear ({activeFilterBadges.length})
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#18181b" />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="search" size={32} color="#a1a1aa" />
          <Text className="mt-3 text-center text-base text-muted-foreground">
            No products match your filters.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {products.map((product) => (
              <View key={product._id} style={{ width: "48%" }}>
                <ProductCard
                  product={{
                    id: product._id,
                    title: product.title,
                    brand: product.brand,
                    image: getCoverImage(product),
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
        </ScrollView>
      )}

      {/* Sticky "view & send" bar — appears once the draft has items, so a
          customer who filled their list from the Shop knows where to send it. */}
      {draftCount > 0 ? (
        <Pressable
          onPress={() => navigation.navigate("Tabs", { screen: "Lists" })}
          className="absolute bottom-3 left-4 right-4 flex-row items-center justify-between rounded-2xl bg-primary px-5 py-3.5 shadow-lg active:opacity-90"
          style={{
            elevation: 6,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text className="text-sm font-semibold text-primary-foreground">
            {draftCount} item{draftCount > 1 ? "s" : ""} in your list
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-sm font-semibold text-primary-foreground">
              View & send
            </Text>
            <Feather name="arrow-right" size={16} color="#fafafa" />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
