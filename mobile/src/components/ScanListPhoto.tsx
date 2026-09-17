import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import {
  MAX_PHOTOS_PER_SCAN,
  useDraftListStore,
} from "@/features/customer/draft-list/store";
import { readListPhotos } from "@/features/customer/grocery-list/api";
import { toast } from "@/lib/toast";

// "Write it from a photo" - for customers who would rather not type.
//
// The photo is only a way of writing: it is sent up, read, and gone. What
// comes back is TEXT, written onto the same paper as everything else, in
// ordinary editable lines - so if the reader mistook a word, the customer
// fixes it right there before the shop ever sees the list. Nothing about the
// photo is kept, on the phone or on the server.
export function ScanListPhoto() {
  const { t } = useTranslation();
  const addScannedLines = useDraftListStore((state) => state.addScannedLines);
  const [reading, setReading] = useState(false);

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
      { text: t("photos.settings"), onPress: () => void Linking.openSettings() },
    ]);
  };

  const fromCamera = async (): Promise<string[]> => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      explainDenied(!permission.canAskAgain);
      return [];
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      mediaTypes: ["images"],
    });
    return result.canceled ? [] : result.assets.map((asset) => asset.uri);
  };

  const fromGallery = async (): Promise<string[]> => {
    // The system picker needs no permission on modern Android: the customer
    // chooses the photo and only that one reaches the app.
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS_PER_SCAN,
    });
    return result.canceled ? [] : result.assets.map((asset) => asset.uri);
  };

  // Read the picked photo(s) and write what they say onto the list.
  const read = async (pick: () => Promise<string[]>) => {
    if (reading) return;

    let uris: string[];
    try {
      uris = await pick();
    } catch (error) {
      console.warn("[scan] picking failed", error);
      toast.error(t("common.somethingWrong"));
      return;
    }
    if (!uris.length) return; // cancelled, or permission refused

    setReading(true);
    try {
      const answer = await readListPhotos(uris.slice(0, MAX_PHOTOS_PER_SCAN));

      if (!answer.readable || !answer.items.length) {
        toast.error(t("photos.notReadable"));
        return;
      }

      const written = addScannedLines(answer.items);
      if (written === 0) {
        toast.success(t("photos.allAlreadyThere"));
        return;
      }
      // Always ask them to check: a misread item becomes a wrong bill, and
      // this is the one moment where fixing it costs nothing.
      toast.success(t("photos.added", { count: written }));
    } catch (error) {
      // The server explains itself (busy, not set up, unreadable); show that
      // rather than a shrug.
      const message = error instanceof Error ? error.message : "";
      toast.error(message || t("photos.readFailed"));
    } finally {
      setReading(false);
    }
  };

  const start = () => {
    if (reading) return;
    Alert.alert(t("photos.addTitle"), undefined, [
      { text: t("photos.camera"), onPress: () => void read(fromCamera) },
      { text: t("photos.gallery"), onPress: () => void read(fromGallery) },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  return (
    <View className="gap-1.5 px-4">
      <Pressable
        onPress={start}
        disabled={reading}
        accessibilityRole="button"
        accessibilityLabel={t("photos.add")}
        accessibilityState={{ disabled: reading, busy: reading }}
        className="h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-secondary active:opacity-80"
        style={{ opacity: reading ? 0.7 : 1 }}
      >
        {reading ? (
          <ActivityIndicator size="small" color="#3c5a64" />
        ) : (
          <Feather name="camera" size={18} color="#3c5a64" />
        )}
        <Text className="text-sm font-bold text-primary">
          {reading ? t("photos.reading") : t("photos.add")}
        </Text>
      </Pressable>

      <Text className="text-[11px] leading-4 text-muted-foreground">
        {reading ? t("photos.readingHint") : t("photos.hint")}
      </Text>
    </View>
  );
}
