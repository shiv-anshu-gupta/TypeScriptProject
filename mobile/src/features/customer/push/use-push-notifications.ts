/**
 * Registering for order alerts, and reacting to one when it arrives.
 *
 * @packageDocumentation
 */

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@clerk/clerk-expo";

import {
  ensureNotificationChannelsAsync,
  registerForPushNotificationsAsync,
} from "@/lib/push";
import { savePushToken } from "./api";
import { registeredPushToken, rememberPushToken } from "./registry";
import { useCustomerGroceryListStore } from "../grocery-list/store";
import {
  isOrderNotification,
  routeFromNotification,
} from "./route-from-notification";
import { openNotificationRoute } from "./open-notification-route";

// The identifier of the last tap acted on. The cold-start tap can reach us
// twice — read on mount and delivered to the response listener — and must
// navigate only once.
let lastHandledTapId: string | null = null;

/**
 * Navigates for one tapped notification, at most once per notification.
 * Unknown or malformed data does nothing.
 */
function routeTappedNotification(
  response: Notifications.NotificationResponse,
): void {
  // Only a plain tap navigates; an action button would mean something else.
  if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return;
  }
  const id = response.notification.request.identifier;
  if (id && id === lastHandledTapId) return;
  lastHandledTapId = id;

  const route = routeFromNotification(response.notification.request.content.data);
  if (route) openNotificationRoute(route);
}

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
 * An order notification (one carrying a `listId`) means the shop changed
 * something, so the fresh statuses are pulled whether it arrived while the
 * app was open or was tapped from the tray. A broadcast (an offer or news)
 * reloads nothing.
 *
 * Tapping a notification also takes the customer where it points — see
 * {@link routeFromNotification}. That includes the tap that cold-started the
 * app, read once on mount and queued until the navigator is ready.
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

  // The tap that launched the app. Read once, on mount; the navigation it asks
  // for waits in navigationRef until the container's onReady. Lists are not
  // reloaded here — Bootstrap loads them anyway once the customer is signed in.
  useEffect(() => {
    // Channels need no sign-in or permission; making them at every launch
    // means a broadcast always finds its "offers" channel.
    void ensureNotificationChannelsAsync();

    try {
      const launchResponse = Notifications.getLastNotificationResponse();
      if (launchResponse) {
        routeTappedNotification(launchResponse);
        // So a later remount (or JS reload) does not replay the same tap.
        Notifications.clearLastNotificationResponse();
      }
    } catch (error) {
      console.warn("Reading the launch notification failed:", error);
    }
  }, []);

  // An order notification means the shop changed something, so pull the
  // fresh statuses — this keeps the tab badge and timeline in sync whether it
  // arrived in the foreground or was tapped from the tray. A broadcast does
  // not touch the customer's lists, so it reloads nothing.
  useEffect(() => {
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data: unknown = notification.request.content.data;
        if (isSignedIn && isOrderNotification(data)) void loadLists();
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data: unknown = response.notification.request.content.data;
        if (isSignedIn && isOrderNotification(data)) void loadLists();
        routeTappedNotification(response);
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isSignedIn, loadLists]);
}
