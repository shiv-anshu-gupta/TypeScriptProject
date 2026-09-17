import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Images } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GroceryListPhoto } from "@/features/admin/grocery-lists/types";
import { cn } from "@/lib/utils";

const blockClass = "border border-border bg-secondary/50 p-3";
const labelClass = "text-xs font-semibold text-foreground";
const hintClass = "mt-1 text-xs text-muted-foreground";

type PhotoThumbProps = {
  url: string;
  alt: string;
  ariaLabel: string;
  broken: boolean;
  /** Extra text inside the tile when the photo is gone — omitted where the
   *  tile is too small to read it. */
  missingLabel?: string;
  className: string;
  selected?: boolean;
  onOpen: () => void;
  onBroken: () => void;
};

function PhotoThumb({
  url,
  alt,
  ariaLabel,
  broken,
  missingLabel,
  className,
  selected,
  onOpen,
  onBroken,
}: PhotoThumbProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      // A photo whose url is dead has nothing to enlarge, so it isn't clickable.
      disabled={broken}
      aria-label={ariaLabel}
      aria-current={selected}
      className={cn(
        "shrink-0 overflow-hidden border transition-colors",
        className,
        broken
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : selected
            ? "border-primary"
            : "border-border hover:border-primary focus-visible:border-primary focus-visible:outline-none",
      )}
    >
      {broken ? (
        <span className="flex size-full flex-col items-center justify-center gap-1 px-1 text-center text-[10px] font-medium">
          <ImageOff className="size-4" />
          {missingLabel}
        </span>
      ) : (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          className="size-full object-cover"
          onError={onBroken}
        />
      )}
    </button>
  );
}

type GroceryListPhotosProps = {
  photos: GroceryListPhoto[];
  listCode: string;
};

/**
 * Photos the customer sent with their list (a handwritten note, or the packet
 * they want). Shown above the items so the shopkeeper reads them BEFORE
 * pricing — a photo-only list has nothing else to price from.
 */
function GroceryListPhotos({ photos, listCode }: GroceryListPhotosProps) {
  // Index of the photo shown large, or null while the viewer is closed.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Photos whose url no longer loads (deleted from Cloudinary). Marked rather
  // than left as an empty grey box — same treatment as the banners page — so
  // the shopkeeper knows to ask the customer to send it again.
  const [broken, setBroken] = useState<Set<number>>(() => new Set());
  const markBroken = (index: number) =>
    setBroken((prev) => new Set(prev).add(index));

  const step = (delta: number) =>
    setOpenIndex((current) =>
      current === null
        ? current
        : (current + delta + photos.length) % photos.length,
    );

  const openPhoto = openIndex === null ? null : photos[openIndex];
  const openIsBroken = openIndex !== null && broken.has(openIndex);
  const hasMany = photos.length > 1;

  return (
    <section className={blockClass}>
      <div className="flex items-center gap-2">
        <Images className="size-4 text-muted-foreground" />
        <span className={labelClass}>Photos from the customer</span>
        <Badge variant="outline">{photos.length}</Badge>
      </div>
      <p className={hintClass}>
        Tap a photo to read it full size — the list may be handwritten.
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {photos.map((photo, index) => (
          <PhotoThumb
            key={photo.url}
            url={photo.url}
            alt={`Photo ${index + 1} sent with list ${listCode}`}
            ariaLabel={`Open photo ${index + 1} of list ${listCode}`}
            broken={broken.has(index)}
            missingLabel="Photo missing"
            className="size-20"
            onOpen={() => setOpenIndex(index)}
            onBroken={() => markBroken(index)}
          />
        ))}
      </div>

      <Dialog
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (!open) setOpenIndex(null);
        }}
      >
        <DialogContent
          className="sm:max-w-3xl"
          // Arrow keys page through the photos — the shopkeeper reads one
          // photo, prices a few items, then moves to the next.
          onKeyDown={(event) => {
            if (!hasMany) return;
            if (event.key === "ArrowLeft") step(-1);
            if (event.key === "ArrowRight") step(1);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Photo {(openIndex ?? 0) + 1} of {photos.length} — list #{listCode}
            </DialogTitle>
            <DialogDescription>
              Sent by the customer with their list.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            {hasMany ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous photo"
                onClick={() => step(-1)}
              >
                <ChevronLeft />
              </Button>
            ) : null}

            <div className="flex min-w-0 flex-1 items-center justify-center bg-muted">
              {openPhoto && !openIsBroken ? (
                <img
                  src={openPhoto.url}
                  alt={`Photo ${(openIndex ?? 0) + 1} sent with list ${listCode}`}
                  className="max-h-[85vh] w-auto max-w-full object-contain"
                  onError={() => {
                    if (openIndex !== null) markBroken(openIndex);
                  }}
                />
              ) : (
                <p className="flex items-center gap-2 p-10 text-center text-sm font-medium text-destructive">
                  <ImageOff className="size-5 shrink-0" />
                  This photo is no longer available — ask the customer to send
                  it again.
                </p>
              )}
            </div>

            {hasMany ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next photo"
                onClick={() => step(1)}
              >
                <ChevronRight />
              </Button>
            ) : null}
          </div>

          {hasMany ? (
            <div className="flex justify-center gap-2">
              {photos.map((photo, index) => (
                <PhotoThumb
                  key={photo.url}
                  url={photo.url}
                  alt=""
                  ariaLabel={`Show photo ${index + 1}`}
                  broken={broken.has(index)}
                  className="size-12"
                  selected={index === openIndex}
                  onOpen={() => setOpenIndex(index)}
                  onBroken={() => markBroken(index)}
                />
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default GroceryListPhotos;
