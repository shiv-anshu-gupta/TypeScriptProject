/**
 * The browser-push opt-in and foreground-message handling.
 *
 * @packageDocumentation
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  isPushConfigured,
  onForegroundMessage,
  pushPermission,
  requestAdminPushToken,
} from "@/lib/firebase";
import { registerAdminPushToken } from "./api";

// Wires the admin browser to Firebase web-push: registers the FCM token with
// the server and shows an in-app toast when a message arrives while the tab is
// focused (the service worker handles the backgrounded case).
/**
 * Manages the push permission and keeps this browser's FCM token registered.
 *
 * @remarks
 * Used only by `AdminPushBell`, which is mounted once in the admin header, so
 * this runs for the whole admin session regardless of which page is open.
 *
 * Its behaviour:
 *
 * - On mount, if permission was already granted on a previous visit, it
 *   silently refreshes the token and re-registers it with the server. No
 *   prompt appears, because the browser resolves `requestPermission`
 *   immediately when the answer is already known. This matters because FCM
 *   tokens can change and nothing else would notice.
 * - It subscribes to foreground messages and turns each into a toast. The
 *   service worker covers the backgrounded case, so without this a push
 *   arriving while the shopkeeper is looking at the panel would be lost.
 * - `enable` runs the full opt-in: prompt, token, register. Call it from a
 *   click — a permission prompt on page load is both rude and, once denied,
 *   irreversible from code.
 *
 * Two silent failures to be aware of. A token that cannot be saved to the
 * server is swallowed: the bell will read "on" while the server still cannot
 * reach this device, and the next visit retries. And the `setup` ref guards
 * against the effect running twice under React Strict Mode, which would
 * otherwise register two message subscriptions and produce duplicate toasts.
 *
 * `permission` is read at mount and after `enable`, so it does not track a
 * change made in browser settings while the page stays open.
 *
 * @returns `configured` (whether Firebase values are present in this build),
 * `permission` (including `"unsupported"`), and `enable`, which resolves to
 * whether a token was obtained.
 */
export function useAdminPush() {
  const [permission, setPermission] = useState(() => pushPermission());
  const setup = useRef(false);
  const configured = isPushConfigured();

  const enable = useCallback(async () => {
    const token = await requestAdminPushToken();
    setPermission(pushPermission());
    if (!token) return false;
    try {
      await registerAdminPushToken(token);
    } catch {
      // token save failed — the bell will still read "on"; retried next visit
    }
    return true;
  }, []);

  useEffect(() => {
    if (!configured || setup.current) return;
    setup.current = true;

    let unsub = () => {};
    void (async () => {
      // Already granted on a previous visit → refresh the token silently
      // (requestPermission resolves instantly to "granted", no prompt).
      if (pushPermission() === "granted") {
        await enable();
      }
      unsub = await onForegroundMessage((payload) => {
        const title = payload.notification?.title || "New order";
        const body = payload.notification?.body || "";
        toast(title, { description: body });
      });
    })();

    return () => unsub();
  }, [configured, enable]);

  return { configured, permission, enable };
}
