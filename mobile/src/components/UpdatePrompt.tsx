import { useEffect, useState } from "react";
import { AppState, Modal, Pressable, Text, View } from "react-native";
import * as Updates from "expo-updates";

import { Button } from "@/components/ui/Button";

// Shows a friendly "a new version is ready" prompt whenever an OTA update has
// been downloaded, and lets the customer apply it immediately (reload) instead
// of waiting for the next natural app restart.
//
// expo-updates already downloads a new update on launch (checkAutomatically:
// ON_LOAD). `isUpdatePending` becomes true once it's downloaded; we also
// re-check whenever the app returns to the foreground so a freshly-published
// update is picked up without a full cold start. No-op in Expo Go / dev
// (Updates.isEnabled is false there).
export function UpdatePrompt() {
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!Updates.isEnabled) return;

    const check = () => {
      Updates.checkForUpdateAsync()
        .then((result) => {
          if (result.isAvailable) return Updates.fetchUpdateAsync();
          return undefined;
        })
        .catch(() => {
          // offline / no update — ignore, we'll check again next time
        });
    };

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, []);

  // If a new update arrives after the user tapped "Later", show it again.
  useEffect(() => {
    if (isUpdatePending) setDismissed(false);
  }, [isUpdatePending]);

  if (!isUpdatePending || dismissed) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="w-full gap-3 rounded-2xl border border-border bg-background p-5">
          <Text className="text-lg font-semibold text-foreground">
            नया अपडेट तैयार है ✨
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            ऐप का नया वर्शन आ गया है। अभी अपडेट करें।{"\n"}
            A new version is ready — update now to get the latest.
          </Text>
          <Button
            label="अभी अपडेट करें · Update now"
            onPress={() => void Updates.reloadAsync()}
          />
          <Pressable
            onPress={() => setDismissed(true)}
            className="items-center py-1"
          >
            <Text className="text-sm font-medium text-muted-foreground">
              बाद में · Later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
