/**
 * The admin catalogue: categories and products, including their image
 * uploads.
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, so the paths below read
 * `/admin/categories...` and `/admin/products...`. Every route asks for
 * `products:manage`, which only an admin holds, so each answers 401 to a
 * caller with no Clerk session and 403 to a customer or to the shop's own
 * staff. The customer-facing twins
 * live in `routes/customer/product.routes.ts` and show only active products.
 *
 * Four routes take `multipart/form-data` rather than JSON, through the
 * {@link upload} middleware, so the global 100 kb `express.json` limit does
 * not apply to them.
 *
 * Image lifecycle is only half automatic. Replacing a category image and
 * deleting a category or a product all leave the old Cloudinary assets in
 * place; only `PUT /admin/products/:id` deletes anything. Nothing in this
 * file reconciles the two stores, so orphaned assets accumulate.
 *
 * Responses are inconsistent by accident: `POST /admin/products` returns
 * full-size Cloudinary URLs while every other product response is passed
 * through `sizedProduct(..., "card")`, and the category routes return raw
 * documents including `imagePublicId` and `__v`.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { getDbUserFromReq } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { asyncHandler } from "../../utils/asyncHandler";
import { escapeRegex } from "../../utils/regex";
import { Category } from "../../models/Category";
import { ok } from "../../utils/envelope";
import { requireFound, requireNumber, requireText } from "../../utils/helpers";
import { Product } from "../../models/Product";
import { AppError } from "../../utils/AppError";
import { sizedProduct } from "../../utils/productImages";
import {
  deleteFromCloudinary,
  uploadManyBuffersToCloudinary,
} from "../../utils/cloudinary";

/**
 * One stored product image: where it lives, how to delete it, and whether it
 * is the one shown first.
 *
 * @remarks
 * `publicId` is the Cloudinary handle and the identity used everywhere in
 * this file — the kept/removed diff on update matches on it, and
 * `coverImagePublicId` names the cover with it. `url` is only ever displayed.
 *
 * Exactly one image is expected to carry `isCover: true`, but nothing
 * enforces that; see `PUT /admin/products/:id`, which can leave a product
 * with none.
 */
type UploadedImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

/**
 * Cloudinary folder for category images.
 *
 * @remarks
 * Product images are not given a folder at the call site and so land in
 * `uploadManyBuffersToCloudinary`'s own default,
 * `ecommerce-monster-video/products`. The two are kept apart so a category
 * picture is never mistaken for a product one when browsing the media
 * library.
 */
const CATEGORY_IMAGE_FOLDER = "ecommerce-monster-video/categories";

export const adminProductRouter = Router();

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * The multipart parser shared by the category and product upload routes.
 *
 * @remarks
 * Files are held in memory as Buffers and never touch disk, because the
 * serverless filesystem is read-only and short-lived; the buffer goes
 * straight to Cloudinary and is then dropped. Nothing streams, so a request
 * costs its own size in memory while it runs.
 *
 * Limits: 5 MB per file and at most 10 files per request. The type check is
 * on the browser-declared MIME type only, not on the bytes, so a renamed file
 * with a forged `Content-Type` still gets through to Cloudinary.
 *
 * The same instance serves both resources, so the category routes inherit the
 * ten-file allowance even though they read a single field.
 *
 * Only the `fileFilter` rejection is an `AppError`. Multer's own limit
 * errors — a file over 5 MB, more than ten files, or a file under an
 * unexpected field name — are raised as `MulterError`, which neither route
 * wraps, so the caller sees 500 `"Internal server error"` instead of a 400
 * explaining what to fix. The banner upload in `settings.routes.ts` does
 * translate them.
 *
 * @throws AppError 400 `"Only JPG, PNG or WebP images can be uploaded"` from
 * the `fileFilter`, before the route handler runs.
 */
// `fileSize`, not `fieldSize`: fieldSize caps ordinary text fields and leaves
// the FILE unbounded, which is what this used to do - a 50 MB upload would be
// read into memory before anything checked it. The banner upload in
// settings.routes.ts has always had this right; this now matches it.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 10 },
  fileFilter: (_req, file, done) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) done(null, true);
    else done(new AppError(400, "Only JPG, PNG or WebP images can be uploaded"));
  },
});

// No router-wide gate. `router.use(...)` runs for every request that enters the
// router - including paths that belong to a DIFFERENT router mounted on the
// same "/admin" prefix - so a blanket guard here refused the shop's staff on
// routes this file knows nothing about. Each route below states its own
// permission instead.

// categories

/**
 * `GET /admin/categories` — every category, A to Z.
 *
 * @remarks
 * Auth: admin. No parameters are read; there is no search and no paging.
 *
 * The documents go out raw, so unlike most responses here they carry
 * `imagePublicId` and `__v`. The customer twin returns the same set —
 * categories have no active/inactive flag, so there is nothing to hide.
 *
 * Side effects: none.
 */
adminProductRouter.get(
  "/categories",
  requirePermission("products:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await Category.find({}).sort({
      name: 1,
    });

    res.json(ok(categories));
  }),
);

/**
 * `POST /admin/categories` — creates a category, with an optional picture.
 *
 * @remarks
 * Auth: admin.
 *
 * `multipart/form-data`, not JSON. Fields: `name`, required and trimmed, and
 * an optional single file under the field name `image` — a second file under
 * that name is a multer error and therefore a 500. Anything else in the body
 * is ignored. Names are not checked for duplicates and the schema has no
 * unique index, so two categories may share a name.
 *
 * With no file the category is created with `imageUrl` and `imagePublicId`
 * set to empty strings rather than left undefined.
 *
 * Answers 201 with the raw created document, including `imagePublicId` and
 * `__v`.
 *
 * Side effects: when a file is sent, one Cloudinary upload to
 * `ecommerce-monster-video/categories`, shrunk to fit a 1600 px box at
 * `quality: auto:good` and never enlarged; then one insert into
 * `categories`. A Cloudinary failure rejects and surfaces as a 500 with
 * nothing written.
 *
 * @throws AppError 400 `"Category name is needed"` when `name` is missing or
 * blank.
 */
adminProductRouter.post(
  "/categories",
  requirePermission("products:manage"),
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    const name = String(req.body.name || "").trim();

    requireText(name, "Category name is needed");

    let imageUrl = "";
    let imagePublicId = "";

    if (req.file) {
      const uploaded = await uploadManyBuffersToCloudinary(
        [req.file.buffer],
        CATEGORY_IMAGE_FOLDER,
      );
      imageUrl = uploaded[0].url;
      imagePublicId = uploaded[0].publicId;
    }

    const category = await Category.create({ name, imageUrl, imagePublicId });

    res.status(201).json(ok(category));
  }),
);

/**
 * `PUT /admin/categories/:id` — renames a category and optionally replaces
 * its picture.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `id`. `multipart/form-data` with `name`, required and trimmed, and an
 * optional single `image`. Despite being a PUT this behaves as a partial
 * update for the image: omitting the file keeps the stored one rather than
 * clearing it, and there is no way to remove a category picture through this
 * API.
 *
 * A malformed `id` is a Mongoose CastError rather than an `AppError`, so it
 * answers 500, not 400 or 404.
 *
 * Answers with the raw updated document.
 *
 * Side effects: when a file is sent, one Cloudinary upload to
 * `ecommerce-monster-video/categories`; then one save to `categories`. The
 * previous Cloudinary asset is NOT deleted — its `publicId` is simply
 * overwritten, so the old file stays in the media library with nothing
 * pointing at it.
 *
 * @throws AppError 400 `"Category name is needed"` when `name` is missing or
 * blank.
 * @throws AppError 404 `"Category not found"` when no category has that id.
 */
adminProductRouter.put(
  "/categories/:id",
  requirePermission("products:manage"),
  upload.single("image"),
  asyncHandler(async (req: Request, res: Response) => {
    const name = String(req.body.name || "").trim();
    const extractCategoryId = req.params.id as string;

    requireText(name, "Category name is needed");

    const existingCategory = await Category.findById(extractCategoryId);
    const category = requireFound(existingCategory, "Category not found");

    category.name = name;

    // A new image replaces the old one; otherwise the existing image stays.
    if (req.file) {
      const uploaded = await uploadManyBuffersToCloudinary(
        [req.file.buffer],
        CATEGORY_IMAGE_FOLDER,
      );
      category.imageUrl = uploaded[0].url;
      category.imagePublicId = uploaded[0].publicId;
    }

    await category.save();
    res.json(ok(category));
  }),
);

/**
 * `DELETE /admin/categories/:id` — removes a category that nothing points at.
 *
 * @remarks
 * Auth: admin. Path: `id`. No body.
 *
 * The product count is taken at the moment of the check, not under a
 * transaction, so a product created between the count and the delete would
 * still be orphaned. The error message quotes the live count and pluralises
 * itself.
 *
 * Answers `{ _id }` only — the deleted document is not echoed back.
 *
 * Side effects: one delete from `categories`. The category's Cloudinary image
 * is NOT removed, even though `imagePublicId` is right there on the document
 * about to be discarded, so the asset is left with nothing referencing it.
 *
 * @throws AppError 404 `"Category not found"` when no category has that id.
 * @throws AppError 400 ``"This category still has ${productCount}
 * product(s). Move or delete them first."`` when products still reference it;
 * the word is singular for a count of one.
 */
adminProductRouter.delete(
  "/categories/:id",
  requirePermission("products:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const extractCategoryId = req.params.id as string;

    const existingCategory = await Category.findById(extractCategoryId);
    const category = requireFound(existingCategory, "Category not found");

    // Every product holds a required reference to its category, so deleting a
    // category that still has products would leave them orphaned.
    const productCount = await Product.countDocuments({
      category: category._id,
    });

    if (productCount > 0) {
      throw new AppError(
        400,
        `This category still has ${productCount} product${
          productCount > 1 ? "s" : ""
        }. Move or delete them first.`,
      );
    }

    await Category.findByIdAndDelete(extractCategoryId);

    res.json(ok({ _id: String(category._id) }));
  }),
);

/**
 * `GET /admin/products` — the catalogue as the shop sees it, newest first.
 *
 * @remarks
 * Auth: admin.
 *
 * Query: `search`, optional. It matches `title` only — not brand,
 * description or category — case-insensitively, as a substring anywhere in
 * the title. The term is escaped before it becomes a regular expression, so
 * punctuation is matched literally rather than reinterpreted.
 *
 * Unlike the customer route this ignores `status`, so inactive products are
 * included; there is no paging and no limit.
 *
 * `category` is populated down to its `name`, and every image URL is rewritten
 * to the card size, so the edit screen loads the same 500 px files the grid
 * does. The body is a bare array under `data`, not an object with an `items`
 * key.
 *
 * Side effects: none.
 */
// products
adminProductRouter.get(
  "/products",
  requirePermission("products:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const search = String(req.query.search || "").trim();

    const query: Record<string, unknown> = {};

    if (search) {
      query.title = { $regex: escapeRegex(search), $options: "i" };
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(ok(products.map((item) => sizedProduct(item, "card"))));
  }),
);

/**
 * `GET /admin/products/:id` — one product for the edit screen.
 *
 * @remarks
 * Auth: admin. Path: `id`. No body or query is read.
 *
 * The missing-product check is `requireText`, an emptiness guard being used
 * as a presence check. It happens to work — a `null` product goes through
 * `String(value || "")` and comes out empty — but it reads as a text
 * validation and does not narrow the type for the line below.
 *
 * Images come back at the card width (500 px), the same as the list, even
 * though this is the edit view where the full-size original would be the
 * better source. `category` is populated down to its `name`.
 *
 * A malformed `id` is a Mongoose CastError rather than an `AppError`, so it
 * answers 500, not 400 or 404.
 *
 * Side effects: none.
 *
 * @throws AppError 404 `"Product not found"` when no product has that id.
 */
adminProductRouter.get(
  "/products/:id",
  requirePermission("products:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id as string;

    const product = await Product.findById(productId).populate(
      "category",
      "name",
    );

    requireText(product, "Product not found", 404);

    res.json(ok(sizedProduct(product, "card")));
  }),
);

/**
 * `POST /admin/products` — creates a product from a multipart form and its
 * images.
 *
 * @remarks
 * Auth: admin.
 *
 * `multipart/form-data`, files under the field name `images`, between one and
 * ten. Text fields: `title`, `description`, `category` and `brand` are all
 * required and trimmed, and `category` must be the `_id` of an existing
 * category. `stock` is required but only guarded against `NaN`, so a negative
 * number passes here and is then refused by the schema's `min: 0` as a 500
 * rather than a 400; an empty `stock` field becomes `0` and passes. `status`
 * defaults to `"active"` and `unit` to `"piece"`, and both are checked only
 * by the schema enum, so a bad value is a 500. `unitValue` is kept only when
 * finite and greater than zero, otherwise it silently becomes `1`. `colors`
 * and `sizes` are taken verbatim from the multipart body and are not
 * validated here.
 *
 * `createdBy` is set from the calling admin's own user record and cannot be
 * supplied by the caller. Price is not part of this route at all.
 *
 * The category existence check uses `requireText` on the document rather than
 * `requireFound`, as in `GET /admin/products/:id`: an emptiness guard
 * standing in for a presence check.
 *
 * The first file uploaded becomes the cover. There is no way to nominate a
 * different one on create; use the update route for that.
 *
 * Answers 201 with the product re-fetched and its category populated, but NOT
 * passed through `sizedProduct` — so this is the one product response whose
 * image URLs are the full-size Cloudinary originals rather than card-width
 * ones. A client that caches the create response will hold different URLs
 * from the ones the list gives it.
 *
 * Side effects: one Cloudinary upload per file to
 * `ecommerce-monster-video/products`, each shrunk to fit a 1600 px box; then
 * one insert into `products`. The uploads happen before the insert, so a
 * document that then fails schema validation leaves its images stranded in
 * Cloudinary.
 *
 * @throws AppError 400 `"Title is required"` when `title` is missing or
 * blank.
 * @throws AppError 400 `"Description is required"` when `description` is
 * missing or blank.
 * @throws AppError 400 `"Category is required"` when `category` is missing or
 * blank.
 * @throws AppError 400 `"Brand is required"` when `brand` is missing or
 * blank.
 * @throws AppError 400 `"Stock is required"` when `stock` does not parse as a
 * number.
 * @throws AppError 404 `"Category not found"` when `category` names no
 * category.
 * @throws AppError 400 `"Atleast one image is needed"` when no file was
 * uploaded.
 */
adminProductRouter.post(
  "/products",
  requirePermission("products:manage"),
  upload.array("images", 10),
  asyncHandler(async (req: Request, res: Response) => {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "").trim();
    const brand = String(req.body.brand || "").trim();
    const stock = Number(req.body.stock);
    const status = String(req.body.status || "active").trim();
    const unit = String(req.body.unit || "piece").trim();
    const unitValueRaw = Number(req.body.unitValue);
    const unitValue =
      Number.isFinite(unitValueRaw) && unitValueRaw > 0 ? unitValueRaw : 1;
    const colors = req.body.colors || [];
    const sizes = req.body.sizes || [];

    requireText(title, "Title is required");
    requireText(description, "Description is required");
    requireText(category, "Category is required");
    requireText(brand, "Brand is required");

    requireNumber(stock, "Stock is required");

    const existingCategory = await Category.findById(category);

    requireText(existingCategory, "Category not found", 404);

    const files = (req.files as Express.Multer.File[]) || [];

    if (!files.length) {
      throw new AppError(400, "Atleast one image is needed");
    }

    const uploadedImages = await uploadManyBuffersToCloudinary(
      files.map((file) => file.buffer),
    );

    const images = uploadedImages.map((img, index) => ({
      url: img.url,
      publicId: img.publicId,
      isCover: index === 0,
    }));

    const user = await getDbUserFromReq(req);

    const product = await Product.create({
      title,
      description,
      category,
      brand,
      images,
      colors,
      sizes,
      unit,
      unitValue,
      stock,
      status,
      createdBy: user._id,
    });

    const createdProduct = await Product.findById(product._id).populate(
      "category",
      "name",
    );

    res.status(201).json(ok(createdProduct));
  }),
);

/**
 * `PUT /admin/products/:id` — replaces a product's fields and reconciles its
 * image set.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `id`. `multipart/form-data` with the same text fields and the same
 * rules as the create route — all of `title`, `description`, `category`,
 * `brand` and `stock` must be sent on every call, because this is a genuine
 * replace: omitting `status`, `unit` or `unitValue` resets them to `"active"`,
 * `"piece"` and `1` rather than leaving them alone. `createdBy` is never
 * touched, so the original author stays.
 *
 * Images are the kept set plus the new files. `existingImages` is a JSON
 * string of the images the client decided to keep, and only each entry's
 * `publicId` is read — a `url` sent with it is ignored, and a `publicId` that
 * does not match a stored image is simply dropped, so the client cannot add
 * images this way. An absent `existingImages` field keeps everything
 * currently stored; a present but unparseable one is treated as `[]`, which
 * removes every existing image. New files are appended after the kept ones.
 *
 * `coverImagePublicId` names the cover. When it is absent the first image in
 * the merged order becomes the cover. When it is present but matches no
 * image, NO image is marked as the cover, and nothing here catches that.
 *
 * Answers with `sizedProduct(..., "card")`, so image URLs are card width —
 * unlike the create route, which returns the full-size originals for the same
 * product.
 *
 * Side effects: one Cloudinary upload per new file; Cloudinary deletes for
 * every stored image no longer in the kept set (best effort — the delete
 * helper swallows its own failures); then one save to `products`. The deletes
 * run BEFORE the "at least one image" check, so a request that removes every
 * image destroys the Cloudinary assets and only then answers 400, leaving the
 * product pointing at URLs that no longer resolve. The delete is also
 * unconditional on the save succeeding, so a later validation failure has the
 * same effect.
 *
 * @throws AppError 400 `"Title is required"` when `title` is missing or
 * blank.
 * @throws AppError 400 `"Description is required"` when `description` is
 * missing or blank.
 * @throws AppError 400 `"Category is required"` when `category` is missing or
 * blank.
 * @throws AppError 400 `"Brand is required"` when `brand` is missing or
 * blank.
 * @throws AppError 400 `"Stock is required"` when `stock` does not parse as a
 * number.
 * @throws AppError 404 `"Category not found"` when `category` names no
 * category.
 * @throws AppError 404 `"Product not found"` when no product has that id.
 * @throws AppError 400 `"Atleast one img is needed"` when the kept and new
 * images together come to nothing. Note the wording differs from the create
 * route's `"Atleast one image is needed"`.
 */
adminProductRouter.put(
  "/products/:id",
  requirePermission("products:manage"),
  upload.array("images", 10),
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id as string;
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "").trim();
    const brand = String(req.body.brand || "").trim();
    const stock = Number(req.body.stock);
    const status = String(req.body.status || "active").trim() as
      | "active"
      | "inactive";
    const unit = String(req.body.unit || "piece").trim();
    const unitValueRaw = Number(req.body.unitValue);
    const unitValue =
      Number.isFinite(unitValueRaw) && unitValueRaw > 0 ? unitValueRaw : 1;
    const colors = req.body.colors || [];
    const sizes = req.body.sizes || [];
    const coverImagePublicId = String(req.body.coverImagePublicId || "").trim();

    requireText(title, "Title is required");
    requireText(description, "Description is required");
    requireText(category, "Category is required");
    requireText(brand, "Brand is required");

    requireNumber(stock, "Stock is required");

    const existingCategoryDoc = await Category.findById(category);
    const existingCategory = requireFound(
      existingCategoryDoc,
      "Category not found",
    );

    const productDoc = await Product.findById(productId);
    const product = requireFound(productDoc, "Product not found");

    const files = (req.files as Express.Multer.File[]) || [];

    const uploadNewImages = await uploadManyBuffersToCloudinary(
      files.map((file) => file.buffer),
    );

    const newlyAddedImages = uploadNewImages.map((image) => ({
      url: image.url,
      publicId: image.publicId,
      isCover: false,
    }));

    // The client sends the images it kept (after any removals) as JSON. Honour
    // that list so removed images actually disappear. If the field is absent
    // (older client), fall back to keeping all current images.
    const currentImages: UploadedImage[] = product.images.map(
      (img: UploadedImage) => ({
        url: img.url,
        publicId: img.publicId,
        isCover: img.isCover,
      }),
    );

    let keptImages: UploadedImage[];
    if (req.body.existingImages === undefined) {
      keptImages = currentImages;
    } else {
      let parsed: unknown = [];
      try {
        parsed = JSON.parse(String(req.body.existingImages) || "[]");
      } catch {
        parsed = [];
      }

      const keptPublicIds = new Set(
        Array.isArray(parsed)
          ? parsed
              .map((img) => (img && img.publicId ? String(img.publicId) : ""))
              .filter(Boolean)
          : [],
      );

      // Keep only the current images whose publicId the client still has.
      keptImages = currentImages.filter((img) =>
        keptPublicIds.has(img.publicId),
      );
    }

    // Delete the removed images from Cloudinary (best-effort, non-blocking).
    const removedPublicIds = currentImages
      .filter((img) => !keptImages.some((k) => k.publicId === img.publicId))
      .map((img) => img.publicId);

    if (removedPublicIds.length) {
      await deleteFromCloudinary(removedPublicIds);
    }

    const mergedImages: UploadedImage[] = [...keptImages, ...newlyAddedImages];

    if (!mergedImages.length) {
      throw new AppError(400, "Atleast one img is needed");
    }

    const finalImages: UploadedImage[] = mergedImages.map(
      (image: UploadedImage, index) => ({
        url: image.url,
        publicId: image.publicId,
        isCover: coverImagePublicId
          ? image.publicId === coverImagePublicId
          : index === 0,
      }),
    );

    product.title = title;
    product.description = description;
    product.category = existingCategory._id;
    product.brand = brand;
    product.colors = colors;
    product.sizes = sizes;
    product.unit = unit;
    product.unitValue = unitValue;
    product.stock = stock;
    product.status = status;
    product.set("images", finalImages);

    await product.save();

    const updatedProduct = await Product.findById(product._id).populate(
      "category",
      "name",
    );

    res.json(ok(sizedProduct(updatedProduct, "card")));
  }),
);

/**
 * `DELETE /admin/products/:id` — removes a product from the catalogue.
 *
 * @remarks
 * Auth: admin. Path: `id`. No body. There is no soft delete and no
 * confirmation; setting `status` to `"inactive"` through the update route is
 * the reversible alternative.
 *
 * Answers `{ _id }` only.
 *
 * Side effects: one delete from `products`. The product's Cloudinary images
 * are NOT deleted, so every image it owned is left in the media library with
 * nothing referencing it. Cart and wishlist rows keep the now-dangling id and
 * are filtered out when they are read.
 *
 * @throws AppError 404 `"Product not found"` when no product has that id.
 */
adminProductRouter.delete(
  "/products/:id",
  requirePermission("products:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id as string;

    const existingProduct = await Product.findById(productId);
    const product = requireFound(existingProduct, "Product not found");

    // Carts/wishlists referencing this product already null-guard missing
    // populated products, so a plain delete is safe.
    await Product.findByIdAndDelete(product._id);

    res.json(ok({ _id: String(product._id) }));
  }),
);
