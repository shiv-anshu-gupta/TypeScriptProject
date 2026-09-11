import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  FlatList,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { useIsFocused } from "@react-navigation/native";

import type { CustomerHomeBanner } from "@/features/customer/home/types";

const SIDE = 16; // matches the px-4 inset used down the Home screen
const GAP = 12;
const PEEK = 28; // how much of the next banner shows, so the row reads as swipeable
const ASPECT = 0.46; // banner height / width - a wide promo strip
const AUTOPLAY_MS = 4500;

// Promo banners uploaded from the admin panel (Settings -> Banners). They are
// images only, so the design lives in the artwork itself.
export function BannerCarousel({ banners }: { banners: CustomerHomeBanner[] }) {
  const { width } = useWindowDimensions();
  const isFocused = useIsFocused();
  const listRef = useRef<FlatList<CustomerHomeBanner>>(null);
  const indexRef = useRef(0);
  const dragging = useRef(false);
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const many = banners.length > 1;
  const itemWidth = width - SIDE * 2 - (many ? PEEK : 0);
  const itemHeight = Math.round(itemWidth * ASPECT);
  const interval = itemWidth + GAP;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => sub.remove();
  }, []);

  // Gentle autoplay. Off while the Home tab is not showing - the app should do
  // no work for a screen nobody is looking at - and off for reduced motion.
  useEffect(() => {
    if (!many || !isFocused || reduceMotion) return;
    const timer = setInterval(() => {
      if (dragging.current) return;
      const next = (indexRef.current + 1) % banners.length;
      indexRef.current = next;
      setIndex(next);
      listRef.current?.scrollToOffset({
        offset: next * interval,
        animated: true,
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [many, isFocused, reduceMotion, banners.length, interval]);

  if (!banners.length) return null;

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const settled = Math.round(event.nativeEvent.contentOffset.x / interval);
    indexRef.current = settled;
    setIndex(settled);
    dragging.current = false;
  };

  return (
    <View className="gap-2.5">
      <FlatList
        ref={listRef}
        data={banners}
        keyExtractor={(banner) => banner._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: SIDE }}
        ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onMomentumScrollEnd={onSettle}
        renderItem={({ item }) => (
          <View
            style={{ width: itemWidth, height: itemHeight }}
            className="overflow-hidden rounded-2xl bg-muted"
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}
      />

      {many ? (
        <View className="flex-row items-center justify-center gap-1.5">
          {banners.map((banner, i) => (
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
