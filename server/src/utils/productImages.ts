import type { ProductDocument } from "../models/Product";
import { cdnImage, type ImageVariant } from "./cloudinary";

// A product on its way out of the server, with its pictures asked for at the
// size they will actually be drawn - small in a grid, larger on the product's
// own page. Everything else about the product goes back untouched.
//
// Only the ADDRESS changes; the database keeps the original picture, so a
// product can be re-sized differently tomorrow without touching a record.
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
