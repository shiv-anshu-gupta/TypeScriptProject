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
export const MAX_IMAGE_BYTES = 1024 * 1024; // 1 MB

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

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

export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file)));
}
