import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { GroceryListPhoto } from "@/features/customer/grocery-list/types";

const THUMB = 56;

// The photos the customer sent with a list, on the list's own card. Tapping
// one opens it full screen - a handwritten note is unreadable at thumbnail
// size, and this is the customer's own record of what they asked for.
export function ListPhotos({ photos }: { photos: GroceryListPhoto[] }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!photos.length) return null;

  const current = openIndex === null ? null : photos[openIndex];

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold text-muted-foreground">
        {t("photos.fromCustomer", { count: photos.length })}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {photos.map((photo, index) => (
          <Pressable
            key={photo.url}
            onPress={() => setOpenIndex(index)}
            accessibilityRole="imagebutton"
            accessibilityLabel={t("photos.fromCustomer", { count: 1 })}
            className="active:opacity-80"
          >
            <Image
              source={{ uri: photo.url }}
              style={{ width: THUMB, height: THUMB, borderRadius: 10 }}
            />
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={current !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpenIndex(null)}
      >
        <View className="flex-1 bg-black/90">
          <Pressable
            onPress={() => setOpenIndex(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={{ marginTop: insets.top + 8 }}
            className="ml-4 h-10 w-10 items-center justify-center rounded-full bg-white/15"
          >
            <Feather name="x" size={20} color="#ffffff" />
          </Pressable>

          <Pressable
            onPress={() => setOpenIndex(null)}
            className="flex-1 items-center justify-center px-3"
          >
            {current ? (
              <Image
                source={{ uri: current.url }}
                style={{ width: "100%", height: "85%" }}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>

          {photos.length > 1 && openIndex !== null ? (
            <View
              style={{ paddingBottom: insets.bottom + 16 }}
              className="flex-row items-center justify-center gap-6"
            >
              <Pressable
                onPress={() =>
                  setOpenIndex(
                    (i) => ((i ?? 0) - 1 + photos.length) % photos.length,
                  )
                }
                hitSlop={10}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
              >
                <Feather name="chevron-left" size={22} color="#ffffff" />
              </Pressable>
              <Text className="text-sm font-semibold text-white">
                {openIndex + 1} / {photos.length}
              </Text>
              <Pressable
                onPress={() =>
                  setOpenIndex((i) => ((i ?? 0) + 1) % photos.length)
                }
                hitSlop={10}
                className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
              >
                <Feather name="chevron-right" size={22} color="#ffffff" />
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}
