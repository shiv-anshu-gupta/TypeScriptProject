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

type Picked = {
  file: File;
  url: string;
  // Problems that block the upload, and advice that doesn't.
  error?: string;
  warning?: string;
};

const MAX_FILES = 10;

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

  const add = async (files: File[]) => {
    const room = MAX_FILES - picked.length;
    const next = await Promise.all(files.slice(0, Math.max(room, 0)).map(inspect));
    setPicked((current) => [...current, ...next]);
  };

  const removeAt = (index: number) => {
    URL.revokeObjectURL(picked[index].url);
    setPicked((current) => current.filter((_, i) => i !== index));
  };

  const ready = picked.filter((p) => !p.error);

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
