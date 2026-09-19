/**
 * The header control for browser push alerts.
 *
 * @packageDocumentation
 */
import { Bell, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminPush } from "@/features/admin/notifications/use-admin-push";

// Header control to turn on browser alerts for new orders. Hidden entirely when
// push isn't configured or the browser can't do web push (e.g. iOS non-PWA).
/**
 * Lets the shopkeeper switch on OS-level alerts for new orders.
 *
 * @remarks
 * Three states:
 *
 * - Push unconfigured, or unsupported by the browser — renders `null`. This is
 *   the trap: a missing `VITE_FIREBASE_*` value makes the bell vanish from the
 *   header with no error and no explanation anywhere in the UI. If someone
 *   reports the bell missing in production, check the environment variables and
 *   redeploy, rather than looking for a bug here.
 * - Permission granted — a static "on" indicator. There is deliberately no way
 *   to switch alerts back off from this app; the browser owns that setting.
 * - Otherwise — a button that asks for permission. When permission was already
 *   denied the button stays visible with different hover text, because a denial
 *   can only be reversed in browser settings and pressing the button again
 *   will do nothing.
 *
 * This bell is only about push, which reaches a closed or backgrounded tab. The
 * chime and toast that fire while the grocery-lists page is open are separate
 * and need no permission at all.
 */
export function AdminPushBell() {
  const { configured, permission, enable } = useAdminPush();

  if (!configured || permission === "unsupported") return null;

  if (permission === "granted") {
    return (
      <span
        title="Order alerts are on"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-primary"
      >
        <BellRing className="h-5 w-5" />
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void enable()}
      title={
        permission === "denied"
          ? "Alerts are blocked — enable notifications for this site in your browser settings"
          : "Get notified of new orders"
      }
    >
      <Bell className="mr-1.5 h-4 w-4" />
      Enable order alerts
    </Button>
  );
}
