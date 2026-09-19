/**
 * Registering for order alerts, and reacting to one when it arrives.
 *
 * @packageDocumentation
 */

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@clerk/clerk-expo";

import { registerForPushNotificationsAsync } from "@/lib/push";
import { savePushToken } from "./api";
import { registeredPushToken, rememberPushToken } from "./registry";
import { useCustomerGroceryListStore } from "../grocery-list/store";

/**
 * Registers this device for push once the customer signs in, and refreshes
 * their lists whenever a notification arrives.
 *
 * @remarks
 * Call it once, from the app root.
 *
 * Registration runs only when signed in and only once per session — a token
 * already recorded in the registry skips it, so the operating system's
 * permission dialog is not asked for again.
 *
 * A device that cannot register is not an error the customer can act on: an
 * emulator, a refused permission or Expo Go are all logged and ignored, with
 * no toast, because a message on every launch would be noise.
 *
 * Both notification listeners do the same thing: a notification means the
 * shop changed something, so pull the fresh statuses. That covers the alert
 * arriving while the app is open and the customer tapping one from the tray.
 *
 * Renders nothing and returns nothing.
 *
 * @see {@link releasePushToken} for the other half — handing the token back
 * at sign-out.
 */
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

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      () => {
        if (isSignedIn) void loadLists();
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isSignedIn, loadLists]);
}
