import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
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

// One entry in the vertical category rail on the left of the product grid:
// a rounded category image (fallback icon) with the name under it.
function RailItem({
  label,
  active,
  onPress,
  image,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  image?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        active
          ? "items-center gap-1.5 border-l-4 border-primary bg-secondary px-1 py-3"
          : "items-center gap-1.5 border-l-4 border-transparent px-1 py-3"
      }
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Feather name="grid" size={18} color="#71717a" />
        </View>
      )}
      <Text
        numberOfLines={2}
        className={
          active
            ? "text-center text-[11px] font-bold text-foreground"
            : "text-center text-[11px] font-medium text-muted-foreground"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
    search,
    setSearch,
    hasActiveFilters,
    changeSort,
    toggleFacet,
    clearFilters,
    activeFilterBadges,
  } = useCustomerProductList(route.params?.category);

  const [searchOpen, setSearchOpen] = useState(false);

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
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-semibold text-foreground">Shop</Text>

          {/* Search toggle — top right */}
          <Pressable
            onPress={() =>
              setSearchOpen((open) => {
                const next = !open;
                if (!next) setSearch("");
                return next;
              })
            }
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
          >
            <Feather
              name={searchOpen ? "x" : "search"}
              size={18}
              color="#18181b"
            />
          </Pressable>
        </View>

        {searchOpen ? (
          <View className="mt-2 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3">
            <Feather name="search" size={16} color="#71717a" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search any product…"
              autoFocus
              returnKeyType="search"
              className="h-11 flex-1 text-base text-foreground"
            />
            {search ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Feather name="x-circle" size={16} color="#71717a" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

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

      <View className="flex-1 flex-row">
        {/* Vertical category rail (Blinkit/Zepto-style) — hard-capped at
            ~20% of the screen via the wrapper View's explicit width. */}
        {categories.length ? (
          <View
            style={{ width: "20%" }}
            className="border-r border-border bg-card"
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4, paddingBottom: 90 }}
            >
              <RailItem
                label="All"
                active={!filters.category}
                onPress={() => {
                  if (filters.category) {
                    toggleFacet("category", filters.category);
                  }
                }}
              />
              {categories.map((category) => (
                <RailItem
                  key={category._id}
                  label={category.name}
                  image={category.imageUrl}
                  active={filters.category === category._id}
                  onPress={() => toggleFacet("category", category._id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="flex-1">
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
            // Virtualized: only visible cards are mounted, so the grid stays
            // fast no matter how many products the shop adds.
            <FlatList
              data={products}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={{ width: "48.5%", marginBottom: 12 }}>
                  <ProductCard
                    product={{
                      id: item._id,
                      title: item.title,
                      brand: item.brand,
                      image: getCoverImage(item),
                      unit: item.unit,
                    }}
                    onPress={() =>
                      navigation.navigate("ProductDetails", {
                        productId: item._id,
                      })
                    }
                  />
                </View>
              )}
            />
          )}
        </View>
      </View>

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
