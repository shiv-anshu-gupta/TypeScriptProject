import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@clerk/clerk-expo";

import { registerForPushNotificationsAsync } from "@/lib/push";
import { savePushToken } from "./api";
import { registeredPushToken, rememberPushToken } from "./registry";
import { useCustomerGroceryListStore } from "../grocery-list/store";

export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);
  // Register this device with the backend once the user is signed in. The
  // token is remembered in a module (not a ref), so signing out can hand it
  // back and the next customer on this phone registers their own.
  useEffect(() => {
    if (!isSignedIn || registeredPushToken()) return;

    async function run() {
      const { token, reason } = await registerForPushNotificationsAsync();

      if (!token) {
        // Logged, not shown: the reasons are for us (emulator, no permission,
        // missing project id) and a customer can do nothing with them. A
        // toast on every launch would be noise.
        console.warn("Push registration failed:", reason);
        return;
      }

      try {
        await savePushToken(token);
        rememberPushToken(token);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save push token";
        console.warn("Saving push token failed:", message);
      }
    }

    void run();
  }, [isSignedIn]);

  // A notification means the shop changed something, so pull the fresh
  // statuses — this keeps the tab badge and timeline in sync whether the
  // notification arrived in the foreground or was tapped from the tray.
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      if (isSignedIn) void loadLists();
    });

    const responseSub =
      Notifications.addNotificationResponseReceivedListener(() => {
        if (isSignedIn) void loadLists();
      });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isSignedIn, loadLists]);
}
