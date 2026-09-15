import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { BannerEditDialog } from "@/components/admin/settings/banner-edit-dialog";
import { BannerList } from "@/components/admin/settings/banner-list";
import { BannerPhonePreview } from "@/components/admin/settings/banner-phone-preview";
import { BannerUploader } from "@/components/admin/settings/banner-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { bannerStatuses } from "@/features/admin/settings/banner-status";
import type { AdminBanner } from "@/features/admin/settings/types";
import { useAdminBanners } from "@/features/admin/settings/use-admin-banners";

// Home banners: the picture strip at the top of the customer app's Home
// screen. Upload, order, hide, schedule and link banners here; the app shows
// the live ones in this order.
function AdminSettings() {
  const { items, limit, loading, uploading, busyId, refresh, upload, update, toggleActive, move, remove } =
    useAdminBanners();
  const [editing, setEditing] = useState<AdminBanner | null>(null);

  const statuses = useMemo(() => bannerStatuses(items, limit), [items, limit]);
  const live = items.filter((_, i) => statuses[i] === "live");
  const hiddenCount = statuses.filter((s) => s === "hidden").length;
  const scheduledCount = statuses.filter((s) => s === "scheduled").length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground">Home banners</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The picture strip at the top of the app's Home screen. Customers see the live banners
            in this order; up to {limit} fit.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading ? (
            <p className="text-sm tabular-nums text-muted-foreground">
              <span className="font-semibold text-foreground">{live.length} live</span>
              {hiddenCount ? ` · ${hiddenCount} hidden` : ""}
              {scheduledCount ? ` · ${scheduledCount} scheduled` : ""}
            </p>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Add banners</CardTitle>
            </CardHeader>
            <CardContent>
              <BannerUploader uploading={uploading} onUpload={upload} />
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Your banners</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && !items.length ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !items.length ? (
                <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No banners yet. Add one above and it appears on the app's Home screen.
                </p>
              ) : (
                <BannerList
                  items={items}
                  statuses={statuses}
                  busyId={busyId}
                  limit={limit}
                  onMove={(banner, step) => void move(banner, step)}
                  onToggle={(banner) => void toggleActive(banner)}
                  onEdit={setEditing}
                  onDelete={remove}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">In the app</CardTitle>
              <p className="text-xs text-muted-foreground">
                What customers see right now. Tap the dots to flip through.
              </p>
            </CardHeader>
            <CardContent>
              <BannerPhonePreview live={live} />
            </CardContent>
          </Card>
        </aside>
      </div>

      <BannerEditDialog
        banner={editing}
        saving={!!editing && busyId === editing._id}
        onClose={() => setEditing(null)}
        onSave={(banner, body) => update(banner, body, "Banner saved")}
      />
    </div>
  );
}

export default AdminSettings;
