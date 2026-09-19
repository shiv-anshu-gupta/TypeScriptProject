/**
 * The prompt for a new Play Store build.
 *
 * @packageDocumentation
 */

import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import * as Updates from "expo-updates";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { apiGet } from "@/lib/api";

/**
 * What the server reports about the published app.
 *
 * @remarks
 * `minVersion` is the floor: below it the prompt becomes mandatory.
 */
type AppVersionInfo = {
  latestVersion: string;
  minVersion: string;
  androidPackage: string;
};

/**
 * Numeric compare of dotted versions: is `current` older than `latest`?
 *
 * @remarks
 * Compares segment by segment as numbers, so `1.0.10` is correctly newer than
 * `1.0.9`. A missing or unparseable segment counts as 0, so a short or
 * malformed version never throws — it just compares low.
 *
 * @returns True only when `current` is strictly older. Equal versions are
 * false, so nothing prompts.
 */
function isOlder(current: string, latest: string): boolean {
  const a = current.split(".").map((n) => parseInt(n, 10) || 0);
  const b = latest.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x < y) return true;
    if (x > y) return false;
  }
  return false;
}

/**
 * A dialog asking the customer to install a newer build from the Play Store,
 * without a way out when their version is below the supported floor.
 *
 * @remarks
 * Prompts the customer to install a NEW PLAY STORE BUILD (a native release),
 * which an OTA update can never deliver. UpdatePrompt handles OTA; this one
 * handles "we published a new release in Play Console".
 *
 * How it knows the installed version: app.json sets
 * `runtimeVersion.policy = "appVersion"`, so `Updates.runtimeVersion` IS the
 * installed binary's version ("1.0.0") — it is baked into the native build and
 * does NOT change when an OTA is applied. That makes this whole feature
 * shippable over OTA, with no native module to add.
 *
 * Android only; no iOS build is published yet. It calls `GET /app-version`
 * directly rather than through a feature module, on mount and on every return
 * to the foreground. Anything that stops it from getting a sensible answer —
 * offline, the endpoint unconfigured, a dev build with no runtime version —
 * leaves it silent rather than guessing.
 *
 * Below the server's `minVersion` the update is mandatory and "Later"
 * disappears. Otherwise "Later" holds until the app is restarted.
 *
 * Mounted once at the app root and takes no props.
 */
export function StoreUpdatePrompt() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AppVersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(() => {
    apiGet<AppVersionInfo>("/app-version")
      .then(setInfo)
      .catch(() => {
        // offline / endpoint not configured — just don't prompt
      });
  }, []);

  useEffect(() => {
    // Play Store only. (No iOS build is published yet.)
    if (Platform.OS !== "android") return;

    check();
    // Re-check when the app comes back to the foreground, so a release made
    // while the app was backgrounded is picked up without a cold start.
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => sub.remove();
  }, [check]);

  const openStore = () => {
    const pkg = info?.androidPackage || "com.skirana.app";
    // Prefer the Play app; fall back to the web listing if it isn't installed.
    Linking.openURL(`market://details?id=${pkg}`).catch(() => {
      void Linking.openURL(
        `https://play.google.com/store/apps/details?id=${pkg}`,
      ).catch(() => {});
    });
  };

  if (Platform.OS !== "android") return null;

  // null in Expo Go / dev builds — nothing sensible to compare, so stay quiet.
  const installed = Updates.runtimeVersion || "";
  if (!installed || !info?.latestVersion) return null;

  if (!isOlder(installed, info.latestVersion)) return null;

  // Below minVersion the update is mandatory — no "Later" escape.
  const forced =
    Boolean(info.minVersion) && isOlder(installed, info.minVersion);
  if (dismissed && !forced) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="w-full gap-3 rounded-2xl border border-border bg-background p-5">
          <Text className="text-lg font-semibold text-foreground">
            {t("storeUpdate.title")}
          </Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            {forced ? t("storeUpdate.forced") : t("storeUpdate.body")}
          </Text>
          <Button label={t("storeUpdate.cta")} onPress={openStore} />
          {!forced ? (
            <Pressable
              onPress={() => setDismissed(true)}
              className="items-center py-1"
            >
              <Text className="text-sm font-medium text-muted-foreground">
                {t("common.later")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
