import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerHomeStore } from "@/features/customer/home/store";
import { ProductCard } from "@/components/ProductCard";
import { ListIntroCard } from "@/components/ListIntroCard";
import { SearchBar } from "@/components/SearchBar";
import { BannerCarousel } from "@/components/BannerCarousel";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { data, loading, loadHome } = useCustomerHomeStore((state) => state);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  // Search results live on the Shop tab, which already owns search, filters
  // and sorting. Home hands the query over rather than duplicating all that.
  const runSearch = () => {
    const term = query.trim();
    navigation.navigate("Tabs", {
      screen: "Shop",
      params: term ? { search: term } : undefined,
    });
    setQuery("");
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3c5a64" />
      </View>
    );
  }

  // Everything above the product grid lives in the list header so the whole
  // screen scrolls as ONE virtualized list (no nested scroll views).
  const listHeader = (
    <View>
      {/* Brand header */}
      <View className="flex-row items-center justify-between border-b border-border/60 px-4 pb-3">
        <View className="flex-row items-center gap-2.5">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <MaterialCommunityIcons
              name="storefront"
              size={20}
              color="#ffffff"
            />
          </View>
          <View>
            <Text className="text-xl font-bold tracking-tight text-foreground">
              sKirana
            </Text>
            <Text className="text-[11px] text-muted-foreground">
              {t("home.tagline")}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Tabs", { screen: "Lists" })}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <MaterialCommunityIcons name="notebook" size={19} color="#1f2a2e" />
        </Pressable>
      </View>

      <View className="mt-4 gap-4">
        {/* What the app does, with a button into the list sheet */}
        <ListIntroCard />

        {/* Product search, with a shortcut to Shop's filters beside it */}
        <View className="flex-row items-center gap-2 px-4">
          <View className="flex-1">
            <SearchBar
              value={query}
              onChangeText={setQuery}
              onSubmit={runSearch}
              placeholder={t("shop.searchPlaceholder")}
            />
          </View>
          <Pressable
            onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={t("home.openFilters")}
            className="h-11 w-11 items-center justify-center rounded-xl bg-primary active:opacity-85"
          >
            <Feather name="sliders" size={18} color="#ffffff" />
          </Pressable>
        </View>

        {/* Promo banners from the admin panel; renders nothing if there are none */}
        <BannerCarousel banners={data.banners} />
      </View>

      {/* Categories */}
      {data.categories.length ? (
        <View className="mt-8 px-4">
          <Text className="mb-3 text-lg font-semibold text-foreground">
            {t("home.browse")}
          </Text>
          <View className="flex-row flex-wrap">
            {data.categories.slice(0, 8).map((category) => (
              <Pressable
                key={category._id}
                onPress={() =>
                  navigation.navigate("Tabs", {
                    screen: "Shop",
                    params: { category: category._id },
                  })
                }
                style={{ width: "25%" }}
                className="items-center gap-1.5 py-2"
              >
                {category.imageUrl ? (
                  <Image
                    source={{ uri: category.imageUrl }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <Feather name="tag" size={20} color="#1f2a2e" />
                  </View>
                )}
                <Text
                  numberOfLines={2}
                  className="text-center text-xs font-medium text-foreground"
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* Products section title */}
      {data.recentProducts.length ? (
        <View className="mb-3 mt-8 flex-row items-center justify-between px-4">
          <Text className="text-lg font-semibold text-foreground">
            {t("home.newArrivals")}
          </Text>
          <Pressable
            onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
          >
            <Text className="text-sm font-semibold text-foreground">
              {t("home.viewAll")}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  return (
    <FlatList
      className="flex-1 bg-background"
      data={data.recentProducts}
      keyExtractor={(item) => item._id}
      numColumns={2}
      columnWrapperStyle={{
        justifyContent: "space-between",
        paddingHorizontal: 16,
      }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={listHeader}
      renderItem={({ item }) => (
        <View style={{ width: "48%", marginBottom: 16 }}>
          <ProductCard
            product={{
              id: item._id,
              title: item.title,
              brand: item.brand,
              image: item.image,
              unit: item.unit,
              unitValue: item.unitValue,
            }}
            onPress={() =>
              navigation.navigate("ProductDetails", { productId: item._id })
            }
          />
        </View>
      )}
    />
  );
}
