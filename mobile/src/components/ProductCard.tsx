import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import { useDraftListStore } from "@/features/customer/draft-list/store";
import { toast } from "@/lib/toast";
import { formatPack } from "@/lib/utils";

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
  const addProduct = useDraftListStore((state) => state.addProduct);
  const packLabel = formatPack(product.unit, product.unitValue);

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 overflow-hidden rounded-2xl border border-border bg-card"
    >
      <View className="relative aspect-[4/5] w-full bg-muted">
        <Image
          source={{ uri: product.image }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={200}
        />

        {/* Quick "add to list" — nested Pressable takes the touch, so tapping
            it doesn't open the details page. */}
        <Pressable
          onPress={() => {
            addProduct(product.title, product.unit, product.unitValue);
            toast.success("Added — send it from the Lists tab");
          }}
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
          <Feather name="plus" size={20} color="#fafafa" />
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
            per {packLabel}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
