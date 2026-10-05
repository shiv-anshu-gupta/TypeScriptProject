/**
 * The promo strip at the top of the Home screen.
 *
 * @packageDocumentation
 */

import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "@/navigation/types";
import type { CustomerHomeBanner } from "@/features/customer/home/types";
import { useGrocerySheetStore } from "@/features/customer/grocery-sheet/store";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SIDE = 16; // matches the px-4 inset used down the Home screen
const GAP = 12;
const PEEK = 28; // how much of the next banner shows, so the row reads as swipeable
const ASPECT = 0.46; // banner height / width - a wide promo strip

/**
 * The space between two banners.
 *
 * @remarks
 * Defined once: an inline component would be a new type on every render, so
 * the separators would remount whenever the page dots change.
 */
function Gap() {
  return <View style={{ width: GAP }} />;
}

/**
 * A swipeable row of promo pictures with page dots. It moves only when the
 * customer swipes it.
 *
 * @remarks
 * Promo banners from the admin panel (Home banners): the live ones, in the
 * order the shop set. The design lives in the artwork itself; a banner can
 * also open something when tapped - the list sheet, the Shop, a category or
 * a product - as chosen in the admin panel.
 *
 * A banner only counts as tappable when this build understands its link type,
 * so a newer server sending an unknown type leaves a picture rather than a
 * dead button. Tapping can open the list sheet or navigate into the Shop tab
 * or a product page.
 *
 * There is no autoplay: a strip that slides on its own pulls the eye away
 * from the list the customer came to write, and moves under a thumb that is
 * about to tap. Banners whose image fails to
 * load are dropped rather than shown as a grey box, and the set of failures is
 * cleared whenever fresh banners arrive, so a weak connection does not hide a
 * banner permanently.
 *
 * Renders nothing when there is nothing left to show.
 */
export function BannerCarousel({ banners }: { banners: CustomerHomeBanner[] }) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<CustomerHomeBanner>>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const navigation = useNavigation<Nav>();

  // A banner only counts as tappable when THIS build knows what its link
  // does: a newer server may send a type this app has never heard of, and a
  // button that does nothing is worse than a picture.
  const canOpen = (banner: CustomerHomeBanner) => {
    const type = banner.link?.type;
    return (
      type === "writeList" ||
      type === "shop" ||
      type === "category" ||
      type === "product"
    );
  };

  const open = (banner: CustomerHomeBanner) => {
    const link = banner.link;
    if (!link) return;
    switch (link.type) {
      case "writeList":
        useGrocerySheetStore.getState().open();
        break;
      case "shop":
        navigation.navigate("Tabs", {
          screen: "Shop",
          params: { browseAll: true },
        });
        break;
      case "category":
        navigation.navigate("Tabs", {
          screen: "Shop",
          params: { category: link.targetId },
        });
        break;
      case "product":
        navigation.navigate("ProductDetails", { productId: link.targetId });
        break;
    }
  };

  // Banners whose image failed to load (e.g. deleted from Cloudinary). They are
  // dropped rather than shown as an empty grey box - a broken banner should
  // never be the thing a customer sees on the Home screen.
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const visible = banners.filter((banner) => !failed.has(banner._id));

  // Fresh banners from the server mean a fresh chance: an image that failed
  // on a weak connection is tried again rather than hidden for good.
  useEffect(() => {
    setFailed((prev) => (prev.size ? new Set() : prev));
  }, [banners]);

  const many = visible.length > 1;
  const itemWidth = width - SIDE * 2 - (many ? PEEK : 0);
  const itemHeight = Math.round(itemWidth * ASPECT);
  const interval = itemWidth + GAP;

  // A banner dropping out can leave the page index past the end - start over.
  useEffect(() => {
    if (indexRef.current >= visible.length) {
      indexRef.current = 0;
      setIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [visible.length]);

  if (!visible.length) return null;

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const settled = Math.round(event.nativeEvent.contentOffset.x / interval);
    indexRef.current = settled;
    setIndex(settled);
  };

  return (
    <View className="gap-2.5">
      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(banner) => banner._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: SIDE }}
        ItemSeparatorComponent={Gap}
        // A slow drag ends without momentum (no onMomentumScrollEnd on iOS),
        // so the dots are updated here too.
        onScrollEndDrag={onSettle}
        onMomentumScrollEnd={onSettle}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            disabled={!canOpen(item)}
            accessibilityRole={canOpen(item) ? "button" : "image"}
            accessibilityLabel={item.title || undefined}
            style={{ width: itemWidth, height: itemHeight }}
            className="overflow-hidden rounded-2xl bg-muted active:opacity-90"
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              onError={() => setFailed((prev) => new Set(prev).add(item._id))}
            />
          </Pressable>
        )}
      />

      {many ? (
        <View className="flex-row items-center justify-center gap-1.5">
          {visible.map((banner, i) => (
            <View
              key={banner._id}
              className={
                i === index
                  ? "h-1.5 w-5 rounded-full bg-primary"
                  : "h-1.5 w-1.5 rounded-full bg-border"
              }
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
