/**
 * The Home tab.
 *
 * @packageDocumentation
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFonts } from "expo-font";
// Only the one weight used, so the update does not carry the other two.
import { Kalam_700Bold } from "@expo-google-fonts/kalam/700Bold";
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
import { SearchEntry } from "@/components/SearchBar";
import { BannerCarousel } from "@/components/BannerCarousel";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useCustomerDisplayName } from "@/features/customer/account/use-display-name";
import { SELLER_NAME } from "@/lib/shop";

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * The landing page: where the customer is in their list journey, then the
 * shop's banners, categories and newest products.
 *
 * @remarks
 * Loads the home payload on mount and asks for a fresh one on every focus.
 * That refresh is rate-limited to once a minute in the store and never blanks
 * the screen, so returning to the tab is cheap and a failed first load gets
 * another try. Signed in, it also reloads the customer's orders on focus,
 * because the shop moves them on — priced, packed, ready — while the customer
 * is elsewhere.
 *
 * Reads `useCustomerHomeStore` for the page itself,
 * `useCustomerGroceryListStore` for the journey card's data, and
 * `useCustomerDisplayName`, which prefers the saved profile over the Clerk
 * account.
 *
 * Fully usable signed out; nothing here is gated.
 *
 * It opens no sheets or modals directly. Everything leads somewhere: the
 * avatar to Account, a category or "View all" or the search box to Shop, a
 * product to its details page. The journey card may open the list sheet, but
 * that is the card's own doing.
 *
 * The brand row and the search box stay fixed at the top - search is what a
 * customer reaches for from anywhere on the page - and gain a hairline once
 * the page scrolls under them. Everything else is one `FlatList`: the journey
 * card, banners and categories in its header, the newest products as its
 * grid, and a signed-off line from the shop as its footer.
 */
/**
 * The line the page ends on: a word from the shop, in a handwritten face.
 *
 * @remarks
 * Kalam ships with the update (an asset, not native code) and covers both
 * Devanagari and Latin; until it has loaded the system font stands in.
 */
function HomeSignOff() {
  const { t } = useTranslation();
  const [fontsLoaded] = useFonts({ Kalam_700Bold });
  const hand = fontsLoaded ? { fontFamily: "Kalam_700Bold" } : undefined;

  return (
    <View className="items-center gap-2 px-8 pb-6 pt-10">
      <View className="h-px w-16 bg-primary/30" />
      <Text
        className="mt-4 text-center text-[26px] leading-[40px] text-primary"
        style={hand}
      >
        {t("home.signOff")}
      </Text>
      <Text
        className="text-center text-base leading-7 text-muted-foreground"
        style={hand}
      >
        {t("home.signOffFrom", { shop: SELLER_NAME })}
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  // One narrow selector per value — subscribing to the whole store would
  // re-render this screen on ANY store change (see ShopScreen for the same
  // pattern).
  const data = useCustomerHomeStore((state) => state.data);
  const loading = useCustomerHomeStore((state) => state.loading);
  const loadHome = useCustomerHomeStore((state) => state.loadHome);
  const displayName = useCustomerDisplayName();
  // The fixed top bar gains a hairline once the page scrolls under it.
  const [scrolled, setScrolled] = useState(false);

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
      // Banners and categories come from the shop and can change during the
      // day; this asks for fresh ones (at most once a minute) without
      // blanking the screen, and retries a first load that failed.
      void loadHome({ refresh: true });
    }, [isSignedIn, loadLists, loadHome]),
  );

  // One object per product, kept until the products change — a fresh object
  // literal per render would make the memoised ProductCard useless. Same
  // pattern as ShopScreen.
  const cards = useMemo(
    () =>
      data.recentProducts.map((item) => ({
        id: item._id,
        title: item.title,
        brand: item.brand,
        image: item.image,
        unit: item.unit,
        unitValue: item.unitValue,
      })),
    [data.recentProducts],
  );

  const openProduct = useCallback(
    (productId: string) => navigation.navigate("ProductDetails", { productId }),
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }: { item: (typeof cards)[number] }) => (
      <View style={{ width: "48%", marginBottom: 16 }}>
        <ProductCard product={item} onPress={openProduct} />
      </View>
    ),
    [openProduct],
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3c5a64" />
      </View>
    );
  }

  // Fixed at the top: who we are, and the search box.
  const topBar = (
    <View
      className={
        scrolled
          ? "gap-3 border-b border-border bg-background px-4 pb-3"
          : "gap-3 border-b border-transparent bg-background px-4 pb-3"
      }
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
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

      {/* Product search. Searching itself happens on the Shop tab, which
          shows results as you type; this opens it ready to type. */}
      <SearchEntry
        placeholder={t("home.searchHint")}
        onPress={() =>
          navigation.navigate("Tabs", {
            screen: "Shop",
            params: { openSearch: true },
          })
        }
      />
    </View>
  );

  // Everything above the product grid lives in the list header so the whole
  // screen scrolls as ONE virtualized list (no nested scroll views).
  const listHeader = (
    <View>
      <View className="mt-4 gap-5">
        {/* The customer's live list journey - the next step, one tap away */}
        <ListProgressCard />

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
            onPress={() =>
              navigation.navigate("Tabs", {
                screen: "Shop",
                params: { browseAll: true },
              })
            }
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
    <View className="flex-1 bg-background">
      {topBar}
      <FlatList
        className="flex-1 bg-background"
        data={cards}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{ paddingBottom: 32 }}
        onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 4)}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={listHeader}
        ListFooterComponent={<HomeSignOff />}
        renderItem={renderCard}
      />
    </View>
  );
}
