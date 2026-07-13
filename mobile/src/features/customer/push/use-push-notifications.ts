import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@clerk/clerk-expo";

import { registerForPushNotificationsAsync } from "@/lib/push";
import { savePushToken } from "./api";
import { useCustomerGroceryListStore } from "../grocery-list/store";

export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);
  const registeredToken = useRef<string | null>(null);

  // Register this device with the backend once the user is signed in.
  useEffect(() => {
    if (!isSignedIn || registeredToken.current) return;

    async function run() {
      const token = await registerForPushNotificationsAsync();

      if (!token) return;

      try {
        await savePushToken(token);
        registeredToken.current = token;
      } catch {
        // A failed registration shouldn't break the app; we retry next launch.
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
