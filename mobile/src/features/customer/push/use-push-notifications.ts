import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@clerk/clerk-expo";

import { registerForPushNotificationsAsync } from "@/lib/push";
import { savePushToken } from "./api";
import { useCustomerGroceryListStore } from "../grocery-list/store";
import { toast } from "@/lib/toast";

export function usePushNotifications() {
  const { isSignedIn } = useAuth();
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);
  const registeredToken = useRef<string | null>(null);

  // Register this device with the backend once the user is signed in.
  useEffect(() => {
    if (!isSignedIn || registeredToken.current) return;

    async function run() {
      const { token, reason } = await registerForPushNotificationsAsync();

      if (!token) {
        // Surface it — a silent failure here means notifications never work.
        console.warn("Push registration failed:", reason);
        toast.error(`Notifications off: ${reason}`);
        return;
      }

      try {
        await savePushToken(token);
        registeredToken.current = token;
        console.log("Push token registered:", token);
        toast.success("Notifications enabled");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to save push token";
        console.warn("Saving push token failed:", message);
        toast.error(`Notifications off: ${message}`);
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
