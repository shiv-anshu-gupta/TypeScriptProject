/**
 * The camera button that reads a handwritten list into the draft.
 *
 * @packageDocumentation
 */

import { useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import {
  MAX_PHOTOS_PER_SCAN,
  useDraftListStore,
} from "@/features/customer/draft-list/store";
import { readListPhotos } from "@/features/customer/grocery-list/api";
import { toast } from "@/lib/toast";

/**
 * A camera button beside Send that offers Camera or Gallery, then writes what
 * the photo says onto the list as ordinary editable lines.
 *
 * @remarks
 * The camera beside Send: photograph the paper instead of typing it out.
 *
 * The photo is only a way of writing: it is sent up, read, and gone. What
 * comes back is TEXT, written onto the same paper as everything else, in
 * ordinary editable lines - so if the reader mistook a word, the customer
 * fixes it right there before the shop ever sees the list. Nothing about the
 * photo is kept, on the phone or on the server.
 *
 * It is one icon on purpose: this sits in a row with Send, and the list
 * itself - the paper - is what the screen is for.
 *
 * Takes no props and is rendered in two places, the list sheet header and the
 * Lists tab, both times next to Send. It writes into `useDraftListStore` via
 * `addScannedLines`, which only reports how many lines were new — items
 * already on the list are not duplicated.
 *
 * At most `MAX_PHOTOS_PER_SCAN` photos go up in one read, a limit kept in step
 * with the server. It always asks the customer to check the result, because a
 * misread item becomes a wrong bill and this is the one free moment to fix it.
 * Server errors are shown as the server worded them, since it knows whether it
 * is busy, unconfigured, or simply could not read the page.
 */
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
      {
        text: t("photos.settings"),
        onPress: () => void Linking.openSettings(),
      },
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
    toast.info(t("photos.reading"));
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
    <Pressable
      onPress={start}
      disabled={reading}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={t("photos.add")}
      accessibilityState={{ disabled: reading, busy: reading }}
      className="h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-accent active:opacity-80"
      style={{ opacity: reading ? 0.6 : 1 }}
    >
      {reading ? (
        <ActivityIndicator size="small" color="#3c5a64" />
      ) : (
        <Feather name="camera" size={18} color="#3c5a64" />
      )}
    </Pressable>
  );
}
