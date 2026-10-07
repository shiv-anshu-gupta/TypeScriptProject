/**
 * Doing the navigating for a tapped notification.
 *
 * @packageDocumentation
 */

import {
  navigationRef,
  runWhenNavigationReady,
} from "@/navigation/navigationRef";
import { useGrocerySheetStore } from "../grocery-sheet/store";
import type { NotificationRoute } from "./route-from-notification";

/**
 * Takes the customer to `route`, now or as soon as the navigator is ready.
 *
 * @remarks
 * Mirrors what a Home banner does for the same link. The list sheet is closed
 * before any other navigation: on Android it is drawn over the whole app, so
 * a screen opened underneath would look like nothing happened.
 *
 * Never throws — a failed navigation is logged and dropped.
 */
export function openNotificationRoute(route: NotificationRoute): void {
  runWhenNavigationReady(() => {
    try {
      const sheet = useGrocerySheetStore.getState();
      if (route.kind !== "writeList") sheet.close();

      switch (route.kind) {
        case "home":
          navigationRef.navigate("Tabs", { screen: "Home" });
          break;
        case "writeList":
          navigationRef.navigate("Tabs", { screen: "Home" });
          sheet.open();
          break;
        case "shop":
          navigationRef.navigate("Tabs", {
            screen: "Shop",
            params: { browseAll: true },
          });
          break;
        case "category":
          navigationRef.navigate("Tabs", {
            screen: "Shop",
            params: { category: route.categoryId },
          });
          break;
        case "product":
          navigationRef.navigate("ProductDetails", {
            productId: route.productId,
          });
          break;
        case "lists":
          navigationRef.navigate("Tabs", { screen: "Lists" });
          break;
      }
    } catch (error) {
      console.warn("Opening a notification failed:", error);
    }
  });
}
