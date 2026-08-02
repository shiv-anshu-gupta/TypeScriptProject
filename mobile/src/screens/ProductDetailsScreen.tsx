import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerProductDetailsStore } from "@/features/customer/products/details/store";
import { useCustomerWishlistStore } from "@/features/customer/wishlist/store";
import { useDraftListStore } from "@/features/customer/draft-list/store";
import {
  buildQuantityString,
  defaultQuantityValue,
} from "@/features/customer/draft-list/quantity";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "@/lib/toast";
import { formatPack } from "@/lib/utils";
import { QuantityControl } from "@/components/QuantityControl";
import {
  getCoverImage,
  getSwatchColor,
} from "@/features/customer/products/product-list.shared";
import type { ProductSize } from "@/features/customer/products/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailsRoute = RouteProp<RootStackParamList, "ProductDetails">;

export function ProductDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<DetailsRoute>();
  const { productId } = route.params;

  const { isLoaded, isSignedIn } = useAuth();
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const wishlistItems = useCustomerWishlistStore((state) => state.items);

  const {
    loading,
    data,
    selectedImage,
    selectedColor,
    selectedSize,
    loadProduct,
    setSelectedImage,
    setSelectedColor,
    setSelectedSize,
    toggleWishlist,
  } = useCustomerProductDetailsStore((state) => state);

  const addProductWithQuantity = useDraftListStore(
    (state) => state.addProductWithQuantity,
  );

  const [qty, setQty] = useState(1);

  useEffect(() => {
    void loadProduct(productId);
  }, [productId, loadProduct]);

  const product = data?.product ?? null;

  // Seed the quantity with a sensible default once the product (and its unit)
  // is known.
  useEffect(() => {
    if (product) setQty(defaultQuantityValue(product.unit, product.unitValue));
  }, [product?._id, product?.unit, product?.unitValue]);

  const isWishlistActive = useMemo(
    () => wishlistItems.some((item) => item.productId === product?._id),
    [wishlistItems, product?._id],
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3c5a64" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <Text className="text-center text-base text-muted-foreground">
          This product could not be loaded.
        </Text>
      </View>
    );
  }

  const gallery = product.images.length
    ? product.images.map((img) => img.url)
    : [getCoverImage(product)];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View className="aspect-square w-full bg-muted">
          <Image
            source={{ uri: selectedImage || gallery[0] }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        </View>

        {gallery.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, padding: 12 }}
          >
            {gallery.map((uri) => (
              <Pressable
                key={uri}
                onPress={() => setSelectedImage(uri)}
                className={
                  selectedImage === uri
                    ? "h-16 w-16 overflow-hidden rounded-lg border-2 border-primary"
                    : "h-16 w-16 overflow-hidden rounded-lg border border-border"
                }
              >
                <Image
                  source={{ uri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View className="gap-4 px-4 pt-4">
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge>{product.category?.name}</Badge>
            {product.stock > 0 ? (
              <Badge className="border-primary/30 bg-secondary">
                {product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
              </Badge>
            ) : (
              <Badge className="border-0 bg-destructive">
                <Text className="text-xs font-medium text-destructive-foreground">
                  Out of stock
                </Text>
              </Badge>
            )}
          </View>

          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </Text>
            <Text className="mt-1 text-2xl font-semibold text-foreground">
              {product.title}
            </Text>
          </View>

          <View className="rounded-xl border border-border bg-secondary p-3">
            <Text className="text-sm text-muted-foreground">
              Sold per{" "}
              <Text className="font-semibold text-foreground">
                {formatPack(product.unit, product.unitValue)}
              </Text>
              . Price will be confirmed by the shop after they review your
              order.
            </Text>
          </View>

          {/* Quantity picker — inline on the details page */}
          {product.stock > 0 ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Quantity
              </Text>
              <QuantityControl
                unit={product.unit}
                unitValue={product.unitValue}
                value={qty}
                onChange={setQty}
              />
            </View>
          ) : null}

          {product.description ? (
            <Text className="text-sm leading-6 text-muted-foreground">
              {product.description}
            </Text>
          ) : null}

          {/* Colors */}
          {product.colors.length ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Color
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {product.colors.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={{ backgroundColor: getSwatchColor(color) }}
                    className={
                      selectedColor === color
                        ? "h-9 w-9 rounded-full border-2 border-primary"
                        : "h-9 w-9 rounded-full border border-border"
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Sizes */}
          {product.sizes.length ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Size</Text>
              <View className="flex-row flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => setSelectedSize(size as ProductSize)}
                    className={
                      selectedSize === size
                        ? "h-11 min-w-11 items-center justify-center rounded-lg border border-primary bg-primary px-3"
                        : "h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card px-3"
                    }
                  >
                    <Text
                      className={
                        selectedSize === size
                          ? "font-semibold text-primary-foreground"
                          : "font-semibold text-foreground"
                      }
                    >
                      {size}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {/* Related */}
          {data?.relatedProducts?.length ? (
            <View className="mt-2 gap-3">
              <Text className="text-lg font-semibold text-foreground">
                You may also like
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {data.relatedProducts.map((related) => (
                  <Pressable
                    key={related._id}
                    onPress={() =>
                      navigation.push("ProductDetails", {
                        productId: related._id,
                      })
                    }
                    className="w-36"
                  >
                    <View className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted">
                      <Image
                        source={{ uri: getCoverImage(related) }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      className="mt-2 text-sm font-medium text-foreground"
                    >
                      {related.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      per {formatPack(related.unit, related.unitValue)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View className="absolute bottom-0 left-0 right-0 flex-row items-center gap-3 border-t border-border bg-background px-4 pb-8 pt-3">
        <Pressable
          onPress={() =>
            toggleWishlist(
              isLoaded,
              isBootstrapped,
              !!isSignedIn,
              isWishlistActive,
            )
          }
          className="h-12 w-12 items-center justify-center rounded-xl border border-border"
        >
          <Feather
            name="heart"
            size={20}
            color={isWishlistActive ? "#dc2626" : "#1d2a2f"}
          />
        </Pressable>
        <View className="flex-1">
          <Button
            label={
              product.stock < 1
                ? "Out of stock"
                : `Add ${buildQuantityString(product.unit, product.unitValue, qty)} to list`
            }
            disabled={product.stock < 1}
            onPress={() => {
              addProductWithQuantity(
                product.title,
                buildQuantityString(product.unit, product.unitValue, qty),
              );
              toast.success("Added — send it from the Lists tab");
            }}
            icon={<Feather name="plus" size={16} color="#ffffff" />}
          />
        </View>
      </View>
    </View>
  );
}
