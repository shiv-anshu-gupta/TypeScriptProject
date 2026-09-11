import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerHomeStore } from "@/features/customer/home/store";
import { useCustomerGroceryListStore } from "@/features/customer/grocery-list/store";
import { ProductCard } from "@/components/ProductCard";
import { ListProgressCard } from "@/components/ListProgressCard";
import { SearchBar } from "@/components/SearchBar";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCustomerDisplayName } from "@/features/customer/account/use-display-name";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { data, loading, loadHome } = useCustomerHomeStore((state) => state);
  const [query, setQuery] = useState("");
  const displayName = useCustomerDisplayName();

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  // The progress card follows the customer's orders, which the shop moves on
  // (priced, packed, ready) while they are away - refresh on every visit.
  const { isSignedIn } = useAuth();
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);
  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) void loadLists();
    }, [isSignedIn, loadLists]),
  );

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

        {/* The customer's avatar - same as on Account - opens their account */}
        <Pressable
          onPress={() => navigation.navigate("Tabs", { screen: "Account" })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("tabs.account")}
          className="active:opacity-80"
        >
          <ProfileAvatar name={displayName} size={40} />
        </Pressable>
      </View>

      <View className="mt-4 gap-4">
        {/* What the app does, with a button into the list sheet */}
        <ListProgressCard />

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
