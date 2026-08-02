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
