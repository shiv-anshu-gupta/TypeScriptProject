import { Bell, BellRing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminPush } from "@/features/admin/notifications/use-admin-push";

// Header control to turn on browser alerts for new orders. Hidden entirely when
// push isn't configured or the browser can't do web push (e.g. iOS non-PWA).
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
