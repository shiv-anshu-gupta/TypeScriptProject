import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Nothing we store needs to be bigger than this. The admin's browser already
// shrinks a photo before sending it, but the server is the last line: one
// 12-megapixel picture saved at full size would sit in the library for ever,
// costing storage on every plan and bandwidth on every view.
const MAX_STORED_DIMENSION = 1600;

export function uploadSingleBufferToCloudinary(
  fileBuffer: Buffer,
  folder = "ecommerce-monster-video/products",
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          {
            width: MAX_STORED_DIMENSION,
            height: MAX_STORED_DIMENSION,
            crop: "limit", // only ever shrinks; never enlarges or crops
            quality: "auto:good",
          },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("Cloudinary upload failed!!!"));
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
}

export async function uploadManyBuffersToCloudinary(
  files: Buffer[],
  folder = "ecommerce-monster-video/products",
): Promise<CloudinaryUploadResult[]> {
  return Promise.all(
    files.map((file) => uploadSingleBufferToCloudinary(file, folder)),
  );
}

// What a stored picture should look like by the time it reaches a phone.
//
// One picture is uploaded once and then shown in several places at very
// different sizes: a product card about 170px wide, a product page about
// 350px, a banner across the screen. Sending the same full-size file to all
// of them is the difference between a shop that opens instantly and one that
// feels heavy - a grid of 20 cards is ~8 MB of original JPEGs, and about
// 0.6 MB once each is asked for at the size it is actually drawn.
//
// Cloudinary does the work in the URL, so nothing has to be re-uploaded and
// nothing in the database changes:
//   f_webp  - the format, named outright (see FORMAT below for why)
//   q_auto  - drop quality only as far as the eye won't notice
//   c_limit - shrink to the width below; never enlarge a small picture
//
// Deliberately NO dpr_auto: it would make a separate derivative for every
// screen density, tripling the transformations billed for the same picture.
// The widths below are already generous enough for a 2x screen.
const VARIANTS = {
  thumb: 200, // category chips, tiny rows
  // A card is ~163-188dp wide in a 2-column grid, and Android phones run at
  // 2.6-3x, so ~490 real pixels. 400 was visibly soft on a 1080p screen; in
  // WebP the extra width costs about what the old JPEG did.
  card: 500, // product grid, home rails
  detail: 900, // the product's own page
  banner: 1200, // full-width promo strip
} as const;

export type ImageVariant = keyof typeof VARIANTS;

// Cloudinary URLs look like
//   https://res.cloudinary.com/<cloud>/image/upload/v123/folder/name.jpg
// and transformations go in directly after "/upload/".
const UPLOAD_MARKER = "/image/upload/";

// WebP is named outright rather than left to f_auto.
//
// f_auto picks the format from the browser's Accept header - and the app is
// not a browser. Measured on a real product picture: the app's own HTTP
// clients (OkHttp/Glide on Android, SDWebImage on iOS) send no WebP in their
// Accept header, so Cloudinary fell back to JPEG and served 33.7 KB where
// WebP is 22.8 KB - a third of the bytes, wasted, on every card.
//
// Naming WebP is safe everywhere this app reaches: Android has decoded it
// since 4.0, expo-image bundles a decoder for iOS, and every browser the
// admin panel runs in takes it. AVIF would be smaller again above ~300px,
// but not on every phone - that is a later decision, not a default.
const FORMAT = "f_webp";

export function cdnImage(url: string, variant: ImageVariant): string {
  // Anything not served by Cloudinary (a seeded link, an empty field) is
  // handed back untouched - a picture that loads slowly beats none at all.
  if (!url || !url.includes(UPLOAD_MARKER)) return url;
  // Already carries one of our transformations: leave it alone.
  if (/\/image\/upload\/f_(auto|webp)/.test(url)) return url;

  const [origin, rest] = url.split(UPLOAD_MARKER);
  return `${origin}${UPLOAD_MARKER}${FORMAT},q_auto,c_limit,w_${VARIANTS[variant]}/${rest}`;
}

// Best-effort removal of images the admin deleted. We never let a failed
// cleanup block the update itself — the DB is the source of truth.
export async function deleteFromCloudinary(publicIds: string[]): Promise<void> {
  await Promise.all(
    publicIds.map((publicId) =>
      cloudinary.uploader
        .destroy(publicId, { resource_type: "image" })
        .catch(() => undefined),
    ),
  );
}
