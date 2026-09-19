/**
 * The drag-and-drop banner uploader.
 *
 * @remarks
 * Files are inspected in the browser before anything is sent, then uploaded in
 * one request. Banners are **not** compressed here: unlike product images they
 * never pass through `client/src/lib/image.ts`, only these checks. The server
 * enforces matching 5 MB, 10-file and MIME limits, so the client rules are a
 * duplicate of a real gate rather than the only one.
 *
 * The picked files and their object URLs live in this component's state alone.
 * Nothing is sent until the admin presses the upload button, and the selection
 * is lost if the page is left.
 *
 * @packageDocumentation
 */

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  BANNER_HEIGHT,
  BANNER_RATIO,
  BANNER_TYPES,
  BANNER_WIDTH,
  MAX_BANNER_BYTES,
} from "@/features/admin/settings/banner-status";

/**
 * One file the admin has chosen, with the result of inspecting it.
 *
 * @remarks
 * `url` is an object URL for the thumbnail and must be revoked. `error` blocks
 * the file from being uploaded; `warning` does not. At most one of the two is
 * set.
 */
type Picked = {
  file: File;
  url: string;
  // Problems that block the upload, and advice that doesn't.
  error?: string;
  warning?: string;
};

/**
 * How many files may be queued at once.
 *
 * @remarks
 * Matches the server's own `MAX_FILES`. Extra files dropped beyond the
 * remaining room are discarded silently by {@link BannerUploader}.
 */
const MAX_FILES = 10;

/**
 * Reads an image's natural pixel size by loading it from an object URL.
 *
 * @remarks
 * Decoding is what makes this asynchronous, and it is also the check that a
 * file is a real, readable image — a decode failure rejects, and `inspect`
 * turns that into a blocking error.
 *
 * @param url - Object URL for the picked file.
 * @returns The natural width and height.
 * @throws Error `"unreadable"` if the browser cannot decode the file.
 */
function readSize(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("unreadable"));
    img.src = url;
  });
}

// Check a file before it's uploaded: type and size must pass; the shape only
// warns, because the app crops to fit and a slightly-off image still works.
/**
 * Validates one picked file and builds its {@link Picked} entry.
 *
 * @remarks
 * Blocking errors, which keep the file out of the upload: a MIME type outside
 * `BANNER_TYPES`, a size over `MAX_BANNER_BYTES` (5 MB), or an image the
 * browser cannot decode.
 *
 * Warnings, which do not block: an aspect ratio more than 8 per cent away from
 * `BANNER_RATIO`, because the app crops to fit; or a width under 1000 px, which
 * may look blurry. The suggested shape is `BANNER_WIDTH` × `BANNER_HEIGHT`
 * (1600 × 736).
 *
 * The object URL is created here and is never revoked by this function — the
 * component owns that, freeing it when the file is removed, after a successful
 * upload, or on unmount.
 *
 * @param file - A file from the input or a drop.
 * @returns The entry, always resolved; validation failures become `error`
 * rather than a rejection.
 */
async function inspect(file: File): Promise<Picked> {
  const url = URL.createObjectURL(file);
  if (!BANNER_TYPES.includes(file.type)) {
    return { file, url, error: "Use a JPG, PNG or WebP image" };
  }
  if (file.size > MAX_BANNER_BYTES) {
    return { file, url, error: `Too large (${(file.size / 1024 / 1024).toFixed(1)} MB) - keep it under 5 MB` };
  }
  try {
    const { width, height } = await readSize(url);
    const off = Math.abs(height / width - BANNER_RATIO) / BANNER_RATIO;
    if (off > 0.08) {
      return { file, url, warning: `${width} × ${height} px - the app will crop it. Best is ${BANNER_WIDTH} × ${BANNER_HEIGHT}.` };
    }
    if (width < 1000) {
      return { file, url, warning: `${width} px wide - may look blurry. Best is ${BANNER_WIDTH} px.` };
    }
    return { file, url };
  } catch {
    return { file, url, error: "This image can't be opened" };
  }
}

/**
 * Lets the admin pick banner images, shows what is wrong with each, and uploads
 * the acceptable ones.
 *
 * @remarks
 * Files arrive by click or by drop on the same button; both paths run
 * {@link inspect}. The queue is capped at {@link MAX_FILES} — anything beyond
 * the remaining room is dropped without a message. The file input's value is
 * cleared after each change so the same file can be picked again.
 *
 * Only files without a blocking error are uploaded, and the button is disabled
 * when none qualify, so a queue of rejects cannot be sent. On success the whole
 * queue is cleared and every object URL revoked.
 *
 * Object URLs are tracked in a ref that mirrors state, so the unmount cleanup
 * revokes whatever was pending without re-running on every change.
 *
 * @param uploading - Whether a request is in flight; disables the button and
 * changes its label.
 * @param onUpload - Sends the files. Wired to `upload` in `useAdminBanners`,
 * which returns `false` on failure so the queue survives a failed attempt.
 * @returns The uploader panel.
 */
export function BannerUploader({
  uploading,
  onUpload,
}: {
  uploading: boolean;
  onUpload: (files: File[]) => Promise<boolean>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [dragging, setDragging] = useState(false);

  // Preview URLs are freed when a file is removed or uploaded, and whatever is
  // left when the page closes.
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  /**
   * Inspects dropped or chosen files and appends them to the queue.
   *
   * @remarks
   * Trims the batch to the room left under {@link MAX_FILES} before inspecting,
   * so extra files are discarded with no message. All inspections run in
   * parallel.
   */
  const add = async (files: File[]) => {
    const room = MAX_FILES - picked.length;
    const next = await Promise.all(files.slice(0, Math.max(room, 0)).map(inspect));
    setPicked((current) => [...current, ...next]);
  };

  /**
   * Removes one queued file and revokes its preview URL.
   *
   * @param index - Position in the queue, as rendered.
   */
  const removeAt = (index: number) => {
    URL.revokeObjectURL(picked[index].url);
    setPicked((current) => current.filter((_, i) => i !== index));
  };

  /** Queued files without a blocking error — the ones that will be uploaded. */
  const ready = picked.filter((p) => !p.error);

  /**
   * Uploads the acceptable files.
   *
   * @remarks
   * Sends `ready` only, so warned-about files go up but errored ones never do.
   * The queue is cleared and every object URL revoked only when `onUpload`
   * reports success; a failure leaves the selection intact for a retry.
   */
  const submit = async () => {
    const done = await onUpload(ready.map((p) => p.file));
    if (done) {
      picked.forEach((p) => URL.revokeObjectURL(p.url));
      setPicked([]);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void add(Array.from(event.dataTransfer.files));
        }}
        className={`flex w-full flex-col items-center gap-3 border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
          dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50"
        }`}
      >
        <span className="flex size-12 items-center justify-center bg-background text-primary ring-1 ring-border">
          <ImagePlus className="size-6" />
        </span>
        <span className="text-sm font-semibold text-foreground">
          Drop banner images here, or click to choose
        </span>
        <span className="text-xs text-muted-foreground">
          {BANNER_WIDTH} × {BANNER_HEIGHT} px · JPG, PNG or WebP · under 5 MB · up to {MAX_FILES} at once
        </span>
      </button>
      <input
        ref={inputRef}
        id="banner-files"
        type="file"
        multiple
        accept={BANNER_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => {
          void add(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {picked.length ? (
        <div className="space-y-3">
          <ul className="space-y-2">
            {picked.map((item, index) => (
              <li key={item.url} className="flex items-center gap-3 border border-border bg-background p-2">
                <img
                  src={item.url}
                  alt=""
                  className="h-12 shrink-0 object-cover"
                  style={{ aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}` }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                  {item.error ? (
                    <p className="text-xs text-destructive">{item.error}</p>
                  ) : item.warning ? (
                    <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {item.warning}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Ready</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.file.name}`}
                  onClick={() => removeAt(index)}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
          <Button className="w-full" disabled={!ready.length || uploading} onClick={() => void submit()}>
            {uploading
              ? "Uploading…"
              : ready.length === 1
                ? "Upload 1 banner"
                : `Upload ${ready.length} banners`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
