import { useEffect } from "react";
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
import { Feather } from "@expo/vector-icons";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerHomeStore } from "@/features/customer/home/store";
import { ProductCard } from "@/components/ProductCard";
import { GroceryList } from "@/components/GroceryList";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { data, loading, loadHome } = useCustomerHomeStore((state) => state);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#18181b" />
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
            <Feather name="shopping-bag" size={19} color="#fafafa" />
          </View>
          <View>
            <Text className="text-xl font-bold tracking-tight text-foreground">
              sKirana
            </Text>
            <Text className="text-[11px] text-muted-foreground">
              Your local shop, on your phone
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Tabs", { screen: "Lists" })}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-secondary"
        >
          <Feather name="clipboard" size={18} color="#18181b" />
        </Pressable>
      </View>

      {/* Handwritten-style draft paper */}
      <View className="mt-3">
        <GroceryList />
      </View>

      {/* Categories */}
      {data.categories.length ? (
        <View className="mt-8 px-4">
          <Text className="mb-3 text-lg font-semibold text-foreground">
            Browse by collection
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
                    <Feather name="tag" size={20} color="#18181b" />
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
            New arrivals
          </Text>
          <Pressable
            onPress={() => navigation.navigate("Tabs", { screen: "Shop" })}
          >
            <Text className="text-sm font-semibold text-foreground">
              View all
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
