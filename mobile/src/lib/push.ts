/**
 * Getting this device an Expo push token, and deciding how a notification
 * behaves when it arrives.
 *
 * @remarks
 * Importing this module has a side effect: it installs the notification
 * handler below. That is why it is imported for its token function and the
 * handler is never registered anywhere else.
 *
 * Nothing here talks to the sKirana server. Handing the token over, and
 * handing it back at sign-out, belong to the push feature.
 *
 * @packageDocumentation
 */

import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// Show a banner and play a sound even when the app is already in the
// foreground (by default Expo would stay silent in that case).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function getProjectId(): string | undefined {
  const fromConfig = Constants.expoConfig?.extra?.eas?.projectId as
    string | undefined;

  const fromEas = (
    Constants as unknown as { easConfig?: { projectId?: string } }
  ).easConfig?.projectId;

  return fromConfig ?? fromEas;
}

/**
 * The outcome of asking this device for a push token.
 *
 * @remarks
 * A `null` token is an ordinary outcome, not an error — an emulator, a
 * refused permission or Expo Go all land here. `reason` then says which, for
 * the log; it is developer English and is never shown to a customer.
 */
export type PushRegistration = {
  token: string | null;
  // Why registration failed — surfaced to the UI so it isn't a silent no-op.
  reason: string;
};

/**
 * Asks for permission and returns this device's Expo push token.
 *
 * Never throws: when push isn't possible (emulator, permission denied, no
 * EAS project id, Expo Go) it reports why instead, so the app keeps working.
 *
 * @remarks
 * It may show the operating system's permission dialog, so call it only once
 * the customer is signed in and there is something to notify them about.
 *
 * On Android it also creates the "default" notification channel, which has to
 * exist before the first notification arrives or that one is delivered
 * silently. The channel is created even on a device that then turns out to be
 * an emulator, because creating it is cheap and getting the order wrong is
 * not recoverable later.
 *
 * The token identifies the *device*, not the account. The caller is
 * responsible for handing it to the server and for handing it back at
 * sign-out.
 *
 * @returns A token with an empty `reason`, or a `null` token and the reason
 * it could not be had.
 */
export async function registerForPushNotificationsAsync(): Promise<PushRegistration> {
  // Android needs a channel or the notification arrives silently.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Order updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#1f2a2e",
    });
  }

  // Remote push only works on a physical device.
  if (!Device.isDevice) {
    return { token: null, reason: "Not a physical device (emulator)" };
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return {
      token: null,
      reason: `Notification permission ${status}. Enable it in Android settings.`,
    };
  }

  const projectId = getProjectId();

  if (!projectId) {
    return {
      token: null,
      reason: "No EAS projectId in app.json. Run `eas init`.",
    };
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return { token: token.data, reason: "" };
  } catch (error) {
    // Expo Go can no longer obtain a push token — a dev build is required.
    const message =
      error instanceof Error ? error.message : "Unknown push token error";
    return { token: null, reason: `Token fetch failed: ${message}` };
  }
}
