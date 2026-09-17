import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import {
  MAX_DRAFT_PHOTOS,
  useDraftListStore,
} from "@/features/customer/draft-list/store";
import { toast } from "@/lib/toast";

const THUMB = 64;

// "Photograph your list" - for customers who would rather not type. The photo
// rides along with whatever lines they did write, and a photo on its own is a
// complete order too.
//
// Photos are only picked here; they are uploaded when the list is sent, so a
// list that is never sent never uploads anything.
export function DraftPhotos() {
  const { t } = useTranslation();
  const photos = useDraftListStore((state) => state.photos);
  const addPhotos = useDraftListStore((state) => state.addPhotos);
  const removePhoto = useDraftListStore((state) => state.removePhoto);
  const [busy, setBusy] = useState(false);

  const room = MAX_DRAFT_PHOTOS - photos.length;

  // Android only asks once or twice; after that the dialog never appears
  // again, so send the customer to Settings rather than leaving them tapping
  // a button that seems dead.
  const explainDenied = (permanent: boolean) => {
    if (!permanent) {
      toast.error(t("photos.cameraDenied"));
      return;
    }
    Alert.alert(t("photos.cameraDenied"), t("photos.openSettings"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("photos.settings"),
        onPress: () => void Linking.openSettings(),
      },
    ]);
  };

  const fromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      explainDenied(!permission.canAskAgain);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      mediaTypes: ["images"],
    });
    if (!result.canceled) addPhotos(result.assets.map((asset) => asset.uri));
  };

  const fromGallery = async () => {
    // The system picker needs no permission on modern Android: the customer
    // chooses the photo and only that one reaches the app.
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      mediaTypes: ["images"],
      allowsMultipleSelection: room > 1,
      selectionLimit: room,
    });
    if (!result.canceled) addPhotos(result.assets.map((asset) => asset.uri));
  };

  const pick = () => {
    if (room <= 0) {
      toast.error(t("photos.limit", { count: MAX_DRAFT_PHOTOS }));
      return;
    }
    Alert.alert(t("photos.addTitle"), undefined, [
      { text: t("photos.camera"), onPress: () => void run(fromCamera) },
      { text: t("photos.gallery"), onPress: () => void run(fromGallery) },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      console.warn("[photos] picking failed", error);
      toast.error(t("common.somethingWrong"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        <Pressable
          onPress={pick}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t("photos.add")}
          style={{ width: THUMB, height: THUMB }}
          className="items-center justify-center gap-0.5 rounded-xl border border-dashed border-primary/50 bg-secondary active:opacity-80"
        >
          {busy ? (
            <ActivityIndicator size="small" color="#3c5a64" />
          ) : (
            <>
              <Feather name="camera" size={18} color="#3c5a64" />
              <Text className="text-[10px] font-semibold text-primary">
                {t("photos.add")}
              </Text>
            </>
          )}
        </Pressable>

        {photos.map((photo) => (
          <View key={photo.id} style={{ width: THUMB, height: THUMB }}>
            <Image
              source={{ uri: photo.uri }}
              style={{ width: THUMB, height: THUMB, borderRadius: 12 }}
            />
            <Pressable
              onPress={() => removePhoto(photo.id)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("photos.remove")}
              className="absolute -right-1.5 -top-1.5 h-6 w-6 items-center justify-center rounded-full bg-foreground"
            >
              <Feather name="x" size={12} color="#ffffff" />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Text className="px-4 text-[11px] leading-4 text-muted-foreground">
        {photos.length
          ? t("photos.attached", { count: photos.length })
          : t("photos.hint")}
      </Text>
    </View>
  );
}
