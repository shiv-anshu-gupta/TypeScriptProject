import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import { useDraftListStore } from "@/features/customer/draft-list/store";
import { useCustomerWishlistStore } from "@/features/customer/wishlist/store";
import { toast } from "@/lib/toast";
import { formatPack } from "@/lib/utils";
import { QuantitySheet } from "@/components/QuantitySheet";

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
  onPress?: () => void;
};

export function ProductCard({ product, onPress }: ProductCardProps) {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const addProductWithQuantity = useDraftListStore(
    (state) => state.addProductWithQuantity,
  );
  const packLabel = formatPack(product.unit, product.unitValue);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Wishlist heart. Subscribing to `items` (not a derived selector) keeps the
  // card in sync when the product is saved/removed from anywhere else.
  const wishlistItems = useCustomerWishlistStore((state) => state.items);
  const toggleItem = useCustomerWishlistStore((state) => state.toggleItem);
  const [savingWishlist, setSavingWishlist] = useState(false);
  const saved = wishlistItems.some((item) => item.productId === product.id);

  const onToggleWishlist = async () => {
    if (!isSignedIn) {
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
      onPress={onPress}
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
          transition={200}
        />

        {/* Wishlist heart — same action as the one on the details screen.
            Top-right so it never collides with the "+" at bottom-right. */}
        <Pressable
          onPress={() => void onToggleWishlist()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t(saved ? "product.removed" : "product.saved")}
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
          onPress={() => setSheetOpen(true)}
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

      <QuantitySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={product.title}
        unit={product.unit}
        unitValue={product.unitValue}
        onConfirm={(quantity) => {
          addProductWithQuantity(product.title, quantity);
          toast.success(t("product.added"));
        }}
      />

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
