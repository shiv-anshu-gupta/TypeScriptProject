/**
 * The public shop catalogue: categories, the product list and one product.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, giving
 * `/customer/categories`, `/customer/products` and `/customer/products/:id`.
 *
 * Every route here is public. This router deliberately calls neither
 * `requireAuth` nor `requireAdmin`, so the app can show the shop before
 * anyone signs in. That is also why every product query is pinned to
 * `status: "active"` — an inactive product must not be visible to the
 * public, and the admin catalogue in `routes/admin/product.routes.ts` is
 * where any status can be read.
 *
 * None of these routes is paginated.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { escapeRegex } from "../../utils/regex";
import { Category } from "../../models/Category";
import { ok } from "../../utils/envelope";
import { Product } from "../../models/Product";
import { requireFound } from "../../utils/helpers";
import { sizedProduct } from "../../utils/productImages";

export const customerProductRouter = Router();

type ProductSort = "recent" | "price-low" | "price-high";

type ProductAppliedFilterListQuery = {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  search?: string;
  sort?: ProductSort;
};

/**
 * `GET /customer/categories` — every category, sorted A to Z by name.
 *
 * @remarks
 * Auth: public. No parameters, no pagination.
 *
 * The documents are returned raw, without a mapper, so `data` is a bare array
 * carrying `imagePublicId` and `__v` as well. `imageUrl` is the stored
 * Cloudinary URL at full size; unlike `/customer/home`, it is not rewritten
 * to a CDN thumbnail here.
 *
 * Side effects: none.
 */
customerProductRouter.get(
  "/categories",

  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await Category.find({}).sort({ name: 1 });

    res.json(ok(categories));
  }),
);

/**
 * `GET /customer/products` — active products, optionally filtered and
 * searched.
 *
 * @remarks
 * Auth: public.
 *
 * Query parameters, all optional and all trimmed: `category` (a category
 * ObjectId, matched exactly), `brand` (exact match), `color` and `size`
 * (each must be a member of the product's `colors` / `sizes` array),
 * and `search` (a case-insensitive match on `title`).
 *
 * `sort` is accepted by the query type but has no effect: the order is
 * hard-coded to newest first. Results are unfiltered by stock and
 * unpaginated, so the whole matching set comes back in one response.
 *
 * A malformed `category` value is not rejected here — Mongoose raises a
 * `CastError`, which the error handler reports as a generic 500 rather than a
 * 400.
 *
 * Images are rewritten to the 500 px `card` variant by `sizedProduct`; every
 * other field of the document is passed through as stored.
 *
 * Side effects: none.
 */
customerProductRouter.get(
  "/products",

  asyncHandler(
    async (
      req: Request<{}, {}, {}, ProductAppliedFilterListQuery>,
      res: Response,
    ) => {
      const category = (req.query.category || "").trim();
      const brand = (req.query.brand || "").trim();
      const color = (req.query.color || "").trim();
      const size = (req.query.size || "").trim();
      const search = (req.query.search || "").trim();

      const query: Record<string, unknown> = {
        status: "active",
      };

      if (category) {
        query.category = category;
      }
      if (brand) {
        query.brand = brand;
      }
      if (color) {
        query.colors = color;
      }
      if (size) {
        query.sizes = size;
      }
      if (search) {
        // Case-insensitive title match. The text is escaped: a customer typing
        // "(", "*" or "+" would otherwise be an invalid regex (the request
        // fails and Shop shows "no products") or an expensive one.
        query.title = { $regex: escapeRegex(search), $options: "i" };
      }

      const sortOption: Record<string, 1 | -1> = { createdAt: -1 };

      const products = await Product.find(query)
        .populate("category", "name")
        .sort(sortOption);

      res.json(ok(products.map((item) => sizedProduct(item, "card"))));
    },
  ),
);

/**
 * `GET /customer/products/:id` — one active product, plus up to four others
 * from the same category.
 *
 * @remarks
 * Auth: public. Path parameter `id` is a product ObjectId.
 *
 * The lookup requires `status: "active"`, so an inactive product is reported
 * as missing rather than hidden behind a different error.
 *
 * The two halves of the response are sized differently on purpose: `product`
 * carries 900 px `detail` images for the product page, while
 * `relatedProducts` carries 500 px `card` images for the strip beneath it.
 * Related products exclude the product itself and are the four newest in its
 * category; a product in a category of its own gets an empty array.
 *
 * Side effects: none.
 *
 * @throws AppError 404 `"Product not found"` when no active product has that
 * id. An `id` that is not a valid ObjectId raises a Mongoose `CastError`
 * instead, which surfaces as a generic 500.
 */
customerProductRouter.get(
  "/products/:id",

  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    }).populate("category", "name");

    const foundProduct = requireFound(product, "Product not found", 404);

    const relatedProducts = await Product.find({
      _id: { $ne: foundProduct._id },
      category: foundProduct.category,
      status: "active",
    })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(4);

    res.json(
      ok({
        product: sizedProduct(foundProduct, "detail"),
        relatedProducts: relatedProducts.map((item) => sizedProduct(item, "card")),
      }),
    );
  }),
);
