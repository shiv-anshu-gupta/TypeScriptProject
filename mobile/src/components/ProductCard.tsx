/**
 * The product tile used in every grid in the app.
 *
 * @packageDocumentation
 */

import { memo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useClerk } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import { useQuantitySheetStore } from "@/features/customer/quantity-sheet/store";
import { useCustomerWishlistStore } from "@/features/customer/wishlist/store";
import { toast } from "@/lib/toast";
import { formatPack } from "@/lib/utils";

/**
 * The fields a card needs.
 *
 * @remarks
 * Deliberately narrower than the full product type, so Home, Shop and the
 * wishlist can all feed the same card from differently shaped payloads.
 */
export type ProductCardData = {
  id: string;
  title: string;
  brand: string;
  image: string;
  unit: string;
  unitValue?: number;
};

type ProductCardProps = {
  product: ProductCardData;
  onPress?: (id: string) => void;
};

/**
 * One product in a grid: its photo, brand, name and pack size, with a heart to
 * save it and a "+" to put it on the list.
 *
 * @remarks
 * See {@link ProductCard} for the memoised export every caller should use.
 *
 * It subscribes to the wishlist store, but only to its own saved/not-saved
 * answer, and reads Clerk's session at press time rather than subscribing to
 * it. Both are about keeping a scrolling grid still.
 *
 * The "+" does not add anything directly. It opens the app's single quantity
 * picker through `useQuantitySheetStore`; this card mounts no sheet, and a
 * card must never mount one.
 *
 * The `expo-image` props here are load-bearing — read the comments on them
 * before changing any of them.
 *
 * @param onPress - Given the product's id, so a list can pass one stable
 * handler and the memoised card isn't re-rendered by a new closure on every
 * scroll.
 */
function ProductCardView({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();
  const clerk = useClerk();
  const askQuantity = useQuantitySheetStore((state) => state.open);
  const packLabel = formatPack(product.unit, product.unitValue);

  // Wishlist heart. Each card watches only its OWN saved/not-saved answer, so
  // saving one product doesn't re-render every card in the grid.
  const saved = useCustomerWishlistStore((state) =>
    state.items.some((item) => item.productId === product.id),
  );
  const toggleItem = useCustomerWishlistStore((state) => state.toggleItem);
  const [savingWishlist, setSavingWishlist] = useState(false);

  const onToggleWishlist = async () => {
    // Read at press time rather than subscribing: useAuth re-renders every
    // card each time Clerk refreshes its token.
    if (!clerk.session) {
      toast.error(t("product.signInToSave"));
      return;
    }
    if (savingWishlist) return;

    try {
      setSavingWishlist(true);
      const result = await toggleItem(product.id);
      toast.success(
        result === "added" ? t("product.saved") : t("product.removed"),
      );
    } catch {
      toast.error(t("product.wishlistFailed"));
    } finally {
      setSavingWishlist(false);
    }
  };

  return (
    <Pressable
      onPress={() => onPress?.(product.id)}
      // w-full (not flex-1): the card's height comes from its own content
      // (image aspect-ratio + text). flex-1 collapsed to zero height inside a
      // plain ScrollView on the Home screen. w-full works in both the Home
      // ScrollView and the Shop FlatList cells.
      className="w-full overflow-hidden rounded-2xl border border-border bg-card"
    >
      <View className="relative aspect-[4/5] w-full bg-muted">
        <Image
          source={{ uri: product.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          // Deliberately no `transition`. On Android, a cross-fade that is
          // still running when the source changes leaves the picture BLANK -
          // expo/expo#35664, fixed in expo-image 56.0.11, and SDK 54 pins
          // 3.0.11. That is the "images vanish when I scroll back up" bug.
          //
          // memory-disk because expo-image's default is `disk` ALONE: without
          // this every picture is re-read and re-decoded from storage each
          // time it scrolls back into view, which is what made the grid feel
          // slow on a cheap phone.
          cachePolicy="memory-disk"
          // Identity of the picture in a reused cell, so a recycled card can
          // never show the previous product's photo.
          recyclingKey={product.id}
        />

        {/* Wishlist heart — same action as the one on the details screen.
            Top-right so it never collides with the "+" at bottom-right. */}
        <Pressable
          onPress={() => void onToggleWishlist()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t(saved ? "product.saved" : "product.save")}
          className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-card/95 active:opacity-80"
          style={{
            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 3,
            shadowOffset: { width: 0, height: 1 },
            opacity: savingWishlist ? 0.6 : 1,
          }}
        >
          <Feather
            name="heart"
            size={17}
            color={saved ? "#c0492f" : "#1f2a2e"}
          />
        </Pressable>

        {/* Quick "add to list" — opens the quantity picker. Nested Pressable
            takes the touch, so tapping it doesn't open the details page. */}
        <Pressable
          onPress={() =>
            askQuantity({
              title: product.title,
              unit: product.unit,
              unitValue: product.unitValue,
            })
          }
          hitSlop={8}
          className="absolute bottom-2 right-2 h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-80"
          style={{
            elevation: 4,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <Feather name="plus" size={20} color="#ffffff" />
        </Pressable>
      </View>

      <View className="gap-1 p-3">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {product.brand}
        </Text>
        <Text numberOfLines={2} className="text-sm font-medium text-foreground">
          {product.title}
        </Text>
        {packLabel ? (
          <Text className="mt-1 text-xs text-muted-foreground">
            {t("shop.perPack", { pack: packLabel })}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * {@link ProductCardView}, memoised. This is the export to use.
 *
 * @remarks
 * A grid of these re-renders whenever anything on the Shop screen changes -
 * the search box, the sort, the draft count. Each card only depends on its
 * own product, so it is compared by identity and skipped otherwise.
 *
 * The memo only pays off if the caller's `product` and `onPress` are stable
 * too, which is why the callers memoise their row data and wrap `onPress` in
 * `useCallback`.
 */
export const ProductCard = memo(ProductCardView);
