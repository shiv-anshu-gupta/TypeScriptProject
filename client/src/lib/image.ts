/**
 * Shrinks pictures in the browser before they are uploaded.
 *
 * @remarks
 * Used by the product and category forms. Home banners deliberately do **not**
 * go through here — they are validated but never re-encoded, and the server
 * enforces matching caps on that path.
 *
 * This is best-effort compression, never a guarantee: every failure path
 * returns the original file untouched. The hard rule is the separate
 * {@link MAX_IMAGE_BYTES} check that callers apply afterwards.
 *
 * Relaxing that check is safe as far as correctness goes — the server caps
 * each upload at 5 MB and accepts only JPEG, PNG and WebP — but it is still a
 * speed decision: a shopkeeper on a slow connection feels every extra hundred
 * kilobytes, once per image, while the page waits.
 *
 * @packageDocumentation
 */
// Downscale + re-encode images in the browser before upload.
//
// Phone-camera photos are often 3–12 MB, which blows past request-body limits
// on most hosting platforms (~4.5 MB) — the edge rejects the upload with a 413
// that carries no CORS headers, so the browser reports a bare "Network Error".
// Shrinking to ~1600px JPEG keeps them well under 1 MB and uploads far faster.

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Hard upper bound for a stored image. Camera photos are auto-compressed well
// below this; anything still larger is rejected with an error.
/**
 * The hard per-file ceiling, 1 MB, applied after compression.
 *
 * @remarks
 * Enforced by the callers, not by {@link compressImage}. The product form
 * rejects each over-size file individually with a toast and still accepts the
 * rest; the category dialog rejects the single file with an inline error and
 * clears it.
 *
 * This is the only size limit that exists for product and category uploads.
 * The server does not check.
 */
export const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB

/**
 * Renders a byte count for an error message.
 *
 * @remarks
 * One decimal place above 1 MB, whole kilobytes below. Display only.
 *
 * @param bytes - A file size.
 * @returns A short string such as `"1.4 MB"` or `"320 KB"`.
 */
export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * Scales an image down to fit a maximum dimension and re-encodes it as JPEG.
 *
 * @remarks
 * Never throws and never rejects. There are five paths that return the input
 * file unchanged, and a caller cannot tell which one was taken:
 *
 * - the file is not a raster image, or is a GIF (animation would be lost);
 * - the browser lacks `createImageBitmap` or `canvas.toBlob`, or cannot decode
 *   the file;
 * - a 2D canvas context is unavailable;
 * - `toBlob` produced nothing;
 * - the re-encoded result came out no smaller than the original.
 *
 * So an uncompressed file reaching the caller is normal, and the
 * {@link MAX_IMAGE_BYTES} check afterwards is what actually protects the
 * upload.
 *
 * Aspect ratio is preserved, and an image already within `maxDimension` is
 * re-encoded but not scaled. Encoding is always lossy JPEG, so transparency in
 * a PNG is lost and the extension is rewritten to `.jpg`.
 *
 * @param file - The picked file.
 * @param maxDimension - Longest side in pixels after scaling. Defaults to 1600.
 * @param quality - JPEG quality from 0 to 1. Defaults to 0.8.
 * @returns The smaller file, or the original.
 */
export async function compressImage(
  file: File,
  maxDimension = MAX_DIMENSION,
  quality = JPEG_QUALITY,
): Promise<File> {
  // Only touch raster images; leave anything else (or tiny files) as-is.
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);

    let { width, height } = bitmap;
    if (width > maxDimension || height > maxDimension) {
      const scale = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (!blob) return file;

    // If compression somehow made it bigger, keep the original.
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^./\\]+$/, "");
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    // If the browser can't decode it, just send the original.
    return file;
  }
}

/**
 * Compresses several files at once.
 *
 * @remarks
 * Runs in parallel and resolves to an array index-aligned with `files`. Since
 * {@link compressImage} never rejects, this never rejects either and always
 * returns one entry per input — some of which may be uncompressed originals.
 *
 * @param files - The picked files.
 * @returns The processed files, in the same order.
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file)));
}
