import { useState } from "react";
import { ArrowDown, ArrowUp, ImageOff, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  linkSummary,
  scheduleSummary,
} from "@/features/admin/settings/banner-status";
import type { AdminBanner, BannerStatus } from "@/features/admin/settings/types";

const STATUS: Record<BannerStatus, { label: string; className: string }> = {
  live: { label: "Live in app", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  hidden: { label: "Hidden", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "Scheduled", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  ended: { label: "Ended", className: "bg-muted text-muted-foreground" },
  overLimit: { label: "Not shown - over the limit", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
};

function VisibilitySwitch({
  on,
  disabled,
  onToggle,
  label,
}: {
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="flex items-center gap-2 text-xs font-medium text-muted-foreground disabled:opacity-50"
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          on ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute size-4 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
      {on ? "Shown" : "Hidden"}
    </button>
  );
}

export function BannerList({
  items,
  statuses,
  busyId,
  limit,
  onMove,
  onToggle,
  onEdit,
  onDelete,
}: {
  items: AdminBanner[];
  statuses: BannerStatus[];
  busyId: string | null;
  limit: number;
  onMove: (banner: AdminBanner, step: -1 | 1) => void;
  onToggle: (banner: AdminBanner) => void;
  onEdit: (banner: AdminBanner) => void;
  onDelete: (banner: AdminBanner) => Promise<boolean>;
}) {
  // Images that failed to load (e.g. removed from Cloudinary) - the app skips
  // these, so flag them here for deleting.
  const [broken, setBroken] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState<AdminBanner | null>(null);

  return (
    <>
      <ol className="divide-y divide-border border border-border">
        {items.map((banner, index) => {
          const busy = busyId === banner._id;
          const status = statuses[index];
          const missing = broken.has(banner._id);
          const name = banner.title || `Banner ${index + 1}`;
          return (
            <li
              key={banner._id}
              className={`flex flex-wrap items-center gap-x-4 gap-y-3 p-3 sm:flex-nowrap ${busy ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-1">
                <span className="w-6 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${name} up`}
                    disabled={index === 0 || !!busyId}
                    onClick={() => onMove(banner, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Move ${name} down`}
                    disabled={index === items.length - 1 || !!busyId}
                    onClick={() => onMove(banner, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              </div>

              <div
                className="relative w-36 shrink-0 overflow-hidden bg-muted"
                style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
              >
                {missing ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageOff className="size-5" />
                  </div>
                ) : (
                  <img
                    src={banner.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={() => setBroken((prev) => new Set(prev).add(banner._id))}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 basis-48 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-foreground">{name}</p>
                  {missing ? (
                    <span className="bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Image missing - delete it
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 text-xs font-medium ${STATUS[status].className}`}>
                      {status === "overLimit" ? `Not shown - only ${limit} fit` : STATUS[status].label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tap: {linkSummary(banner)} · Shows: {scheduleSummary(banner)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <VisibilitySwitch
                  on={banner.isActive}
                  disabled={!!busyId}
                  label={`Show ${name} in the app`}
                  onToggle={() => onToggle(banner)}
                />
                <Button variant="outline" size="sm" disabled={!!busyId} onClick={() => onEdit(banner)}>
                  <Pencil /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete ${name}`}
                  disabled={!!busyId}
                  onClick={() => setConfirming(banner)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <Dialog open={!!confirming} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this banner?</DialogTitle>
            <DialogDescription>
              It disappears from the app and its image is deleted. To take it down for a while
              instead, switch it to Hidden.
            </DialogDescription>
          </DialogHeader>
          {confirming ? (
            <img
              src={confirming.imageUrl}
              alt=""
              className="w-full bg-muted object-cover"
              style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
            />
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={!!busyId}
              onClick={async () => {
                if (confirming && (await onDelete(confirming))) setConfirming(null);
              }}
            >
              {busyId ? "Deleting…" : "Delete banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
