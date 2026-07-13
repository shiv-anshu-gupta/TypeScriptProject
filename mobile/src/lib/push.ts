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
    | string
    | undefined;

  const fromEas = (Constants as unknown as { easConfig?: { projectId?: string } })
    .easConfig?.projectId;

  return fromConfig ?? fromEas;
}

/**
 * Asks for permission and returns this device's Expo push token.
 *
 * Returns null (never throws) when push isn't possible — e.g. running in
 * Expo Go, on an emulator, permission denied, or no EAS project id — so the
 * app keeps working without notifications.
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // Android needs a channel or the notification arrives silently.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Order updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#18181b",
    });
  }

  // Remote push only works on a physical device.
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") return null;

  const projectId = getProjectId();

  if (!projectId) {
    console.warn(
      "Push notifications disabled: no EAS projectId. Run `eas init` in mobile/.",
    );
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    // Expo Go can no longer obtain a push token — a dev build is required.
    console.warn("Could not get an Expo push token", error);
    return null;
  }
}
