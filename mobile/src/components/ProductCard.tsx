import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";

export type ProductCardData = {
  id: string;
  title: string;
  brand: string;
  image: string;
  unit: string;
};

type ProductCardProps = {
  product: ProductCardData;
  onPress?: () => void;
};

export function ProductCard({ product, onPress }: ProductCardProps) {
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
      </View>

      <View className="gap-1 p-3">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {product.brand}
        </Text>
        <Text numberOfLines={2} className="text-sm font-medium text-foreground">
          {product.title}
        </Text>
        {product.unit ? (
          <Text className="mt-1 text-xs text-muted-foreground">
            per {product.unit}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
