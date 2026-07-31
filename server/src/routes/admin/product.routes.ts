import { Router, type Request, type Response } from "express";
import multer from "multer";
import { getDbUserFromReq, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { Category } from "../../models/Category";
import { ok } from "../../utils/envelope";
import { requireFound, requireNumber, requireText } from "../../utils/helpers";
import { Product } from "../../models/Product";
import { AppError } from "../../utils/AppError";
import {
  deleteFromCloudinary,
  uploadManyBuffersToCloudinary,
} from "../../utils/cloudinary";

type UploadedImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

const CATEGORY_IMAGE_FOLDER = "ecommerce-monster-video/categories";

export const adminProductRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 5 * 1024 * 1024,
    files: 10,
  },
});

adminProductRouter.use(requireAdmin);

// categories

adminProductRouter.get(
  "/categories",
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await Category.find({}).sort({
      name: 1,
    });

    res.json(ok(categories));
  }),
);

adminProductRouter.post(
  "/categories",
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

adminProductRouter.put(
  "/categories/:id",
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

adminProductRouter.delete(
  "/categories/:id",
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

// products
adminProductRouter.get(
  "/products",
  asyncHandler(async (req: Request, res: Response) => {
    const search = String(req.query.search || "").trim();

    const query: Record<string, unknown> = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(ok(products));
  }),
);

adminProductRouter.get(
  "/products/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id as string;

    const product = await Product.findById(productId).populate(
      "category",
      "name",
    );

    requireText(product, "Product not found", 404);

    res.json(ok(product));
  }),
);

adminProductRouter.post(
  "/products",
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

adminProductRouter.put(
  "/products/:id",
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

    res.json(ok(updatedProduct));
  }),
);

adminProductRouter.delete(
  "/products/:id",
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
