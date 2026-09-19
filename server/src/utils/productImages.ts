/**
 * Shaping a product for the wire, so its pictures arrive at the size they
 * are drawn at.
 *
 * @packageDocumentation
 */
import type { ProductDocument } from "../models/Product";
import { cdnImage, type ImageVariant } from "./cloudinary";

/**
 * A product on its way out of the server, with its pictures asked for at the
 * size they will actually be drawn - small in a grid, larger on the product's
 * own page. Everything else about the product goes back untouched.
 *
 * @remarks
 * Only the ADDRESS changes; the database keeps the original picture, so a
 * product can be re-sized differently tomorrow without touching a record.
 *
 * Call this on every product leaving a route. The product list endpoints use
 * `"card"` and a product's own page uses `"detail"`.
 *
 * @param variant - which width to ask Cloudinary for; see
 * {@link ImageVariant}.
 * @returns A plain object (the document is converted with `toObject`), so it
 * is no longer a Mongoose document and cannot be saved.
 */
export function sizedProduct(product: ProductDocument, variant: ImageVariant) {
  const plain = product.toObject();

  return {
    ...plain,
    images: (plain.images ?? []).map((image) => ({
      ...image,
      url: cdnImage(image.url, variant),
    })),
  };
}
