/**
 * The signed-in customer's own cart and wishlist.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, so the paths below are
 * `/customer/cart*` and `/customer/wishlist*`. `requireAuth` is applied to the
 * whole router, so every route needs a signed-in caller of any role; there is
 * no admin route here. Each handler resolves its own `users` record through
 * `getDbUserFromReq`, and the cart and wishlist are always the caller's own —
 * no route accepts a user id.
 *
 * No shipped client reaches the cart routes. The web client's router has no
 * customer pages at all, and the mobile app calls only the wishlist pair; the
 * web cart feature folder still imports these endpoints but nothing routes to
 * it (`docs/API.md` § 7.2). They remain live and authenticated, so they are
 * still a real, reachable surface for anyone holding a session token.
 *
 * Every handler answers with the whole cart or the whole wishlist rather than
 * the row it changed, so a client can replace its local state outright.
 *
 * `POST /cart/items` and `POST /cart/sync` both carry defects recorded below;
 * they are documented, not fixed.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { Product, ProductSize } from "../../models/Product";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { cdnImage } from "../../utils/cloudinary";
import { Cart, CartItem } from "../../models/Cart";
import { requireFound, requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";
import { Wishlist } from "../../models/Wishlist";
import { Types } from "mongoose";

export const customerCartWishlistRouter = Router();

type ProductPreview = {
  _id: string;
  title: string;
  brand: string;
  images: Array<{
    url: string;
    isCover?: boolean;
  }>;
};

type CartPreviewItem = {
  product: ProductPreview | null;
  quantity: number;
  color?: string;
  size?: ProductSize;
};

type SyncCartItemInput = {
  productId?: string;
  quantity?: number;
  color?: string;
  size?: ProductSize;
};

/**
 * Flattens a populated product into the `{ productId, title, brand, image }`
 * shape shared by every cart row and wishlist tile.
 *
 * @remarks
 * The Mongo `_id` is renamed to `productId` and stringified. `images` collapses
 * to a single `image` string: the cover image if one is flagged, otherwise the
 * first image, otherwise `""` — which `cdnImage` hands back unchanged, so an
 * imageless product yields an empty string rather than a broken URL.
 *
 * Everything else on the product is deliberately omitted — price, stock,
 * `colors`, `sizes`, `status`, description, ratings. A caller that needs a
 * price must fetch the product itself, which is why these responses cannot
 * show a cart total in money.
 *
 * @param product - A product populated with `title brand images` only.
 * @returns The wire shape for one row.
 */
function formatProduct(product: ProductPreview) {
  // A cart row and a wishlist tile are small - card size covers both.
  const image = cdnImage(
    product.images.find((item) => item.isCover)?.url ||
      product.images[0]?.url ||
      "",
    "card",
  );

  return {
    productId: String(product._id),
    title: product.title,
    brand: product.brand,
    image,
  };
}

/**
 * Reads a user's cart and builds the `{ items, totalQuantity }` body that
 * every cart route returns.
 *
 * @remarks
 * A user with no cart document is not an error: the query returns `null` and
 * the result is an empty cart, so a first-time caller sees the same shape as
 * everyone else.
 *
 * Rows whose product has since been deleted are dropped silently by the
 * `flatMap`, never returned as `null`. A client therefore cannot tell a
 * removed row from one that was never added, and `totalQuantity` counts only
 * the surviving rows.
 *
 * `color` and `size` are carried through untouched, so they are absent from a
 * row for a product that defines no variants.
 *
 * @param userId - The `users` `_id`, as a string.
 * @returns The cart body, ready for `ok()`.
 */
async function getCartResponse(userId: string) {
  const cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "title brand images",
  );

  const cartItems = (cart?.items || []) as CartPreviewItem[];

  const items = cartItems.flatMap((cartItem) => {
    if (!cartItem.product) return [];

    return [
      {
        ...formatProduct(cartItem.product),
        quantity: cartItem.quantity,
        color: cartItem.color,
        size: cartItem.size,
      },
    ];
  });

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    totalQuantity,
  };
}

/**
 * Reads a user's wishlist and builds the `{ items }` body that every wishlist
 * route returns.
 *
 * @remarks
 * The same shape as a cart row minus `quantity`, `color` and `size`, and there
 * is no `totalQuantity`: a wishlist is a plain set of products.
 *
 * As with the cart, a missing wishlist document yields an empty list rather
 * than an error, and entries whose product has been deleted are dropped
 * silently.
 *
 * @param userId - The `users` `_id`, as a string.
 * @returns The wishlist body, ready for `ok()`.
 */
async function getWishlistResponse(userId: string) {
  const wishlist = await Wishlist.findOne({ user: userId }).populate(
    "products",
    "title brand images",
  );

  const products = (wishlist?.products || []) as Array<ProductPreview | null>;

  const items = products.flatMap((productItem) => {
    if (!productItem) return [];

    return [formatProduct(productItem)];
  });

  return { items };
}

/**
 * Validates the colour and size a caller picked against the variants the
 * product actually offers.
 *
 * @remarks
 * The product decides whether a choice is needed. If `colors` is non-empty a
 * colour is required and must be one of the listed values; the same for
 * `sizes`. If the product lists none, the caller's value is ignored entirely
 * and the corresponding field comes back `undefined` — so a stray `color` on a
 * plain grocery item is discarded rather than rejected.
 *
 * The returned `undefined`s matter downstream: `isSameCartItem` treats an
 * absent colour or size as `""`, so a variantless product has exactly one
 * possible cart row.
 *
 * @param product - The product being added or adjusted; only `colors` and
 * `sizes` are read.
 * @param colorValue - The caller's colour, already trimmed. Empty means none
 * was sent.
 * @param sizeValue - The caller's size, already trimmed. Empty means none was
 * sent.
 * @returns `{ color, size }`, each `undefined` when the product defines no
 * such variant.
 * @throws AppError 400 `"Color is required"` when the product lists colours
 * and none was sent.
 * @throws AppError 400 `"Selected color is invalid"` when the colour is not
 * one the product lists.
 * @throws AppError 400 `"Size is required"` when the product lists sizes and
 * none was sent.
 * @throws AppError 400 `"Selected size is invalid"` when the size is not one
 * the product lists.
 */
function getSelectedvariant(
  product: { colors: string[]; sizes: ProductSize[] },
  colorValue: string,
  sizeValue: string,
) {
  let color: string | undefined;
  let size: ProductSize | undefined;

  if (product.colors.length > 0) {
    if (!colorValue) {
      throw new AppError(400, "Color is required");
    }

    if (!product.colors.includes(colorValue)) {
      throw new AppError(400, "Selected color is invalid");
    }

    color = colorValue;
  }

  if (product.sizes.length > 0) {
    if (!sizeValue) {
      throw new AppError(400, "Size is required");
    }

    if (!product.sizes.includes(sizeValue as ProductSize)) {
      throw new AppError(400, "Selected size is invalid");
    }

    size = sizeValue as ProductSize;
  }

  return { color, size };
}

/**
 * Decides whether an existing cart row is the same line as the product and
 * variant a caller named.
 *
 * @remarks
 * A cart row is identified by product *and* variant, so the same product in
 * two colours is two rows. The product reference is compared as a string, so
 * it works whether `item.product` is an ObjectId or a populated document.
 *
 * Absent and empty are the same thing here: both sides of the colour and size
 * comparison fall back to `""`, so a row saved with no colour matches a lookup
 * that passed `undefined`. The comparison is exact and case-sensitive.
 *
 * @param item - An existing row from `cart.items`.
 * @param productId - The product `_id`, as a string.
 * @param color - The chosen colour, or `undefined` for none.
 * @param size - The chosen size, or `undefined` for none.
 * @returns `true` when the row is the one to adjust.
 */
function isSameCartItem(
  item: CartItem,
  productId: string,
  color?: string,
  size?: string,
) {
  return (
    String(item.product) === productId &&
    (item.color || "") === (color || "") &&
    (item.size || "") === (size || "")
  );
}

customerCartWishlistRouter.use(requireAuth);

/**
 * `GET /customer/cart` — returns the caller's cart.
 *
 * @remarks
 * Auth: signed-in customer. No parameters are read.
 *
 * A caller who has never added anything gets `{ items: [], totalQuantity: 0 }`
 * rather than a 404, and no cart document is created by reading.
 *
 * Rows whose product has been deleted are absent from the response.
 */
customerCartWishlistRouter.get(
  "/cart",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    res.json(ok(await getCartResponse(String(dbUser._id))));
  }),
);

/**
 * `POST /customer/cart/items` — adds a product to the caller's cart and
 * returns the whole cart.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `productId` (required, trimmed), `quantity` (defaults to 1, must be at
 * least 1), and `color` / `size`, which are required only when the product
 * defines them. Note that this is the one cart route that takes the variant in
 * the body; increase, decrease and delete read it from the query string.
 *
 * Only a product with `status: "active"` can be added; an archived or draft
 * product is reported as not found, so a caller cannot distinguish the two.
 *
 * Stock is checked twice: the requested quantity on its own, and again as the
 * new running total when the row already exists. Both refusals use the same
 * message. Stock is only read, never reserved or decremented, so two callers
 * can each fill a cart past the real stock.
 *
 * Known defect, documented rather than fixed: the "already in cart" branch
 * tests `itemIndex > 0` instead of `>= 0`, so re-adding the product that sits
 * at index 0 falls through to the push and creates a second identical row
 * instead of incrementing the first. Every comparable check in this file uses
 * `>= 0`.
 *
 * Side effects: creates the `carts` document when the caller has none, then
 * writes it.
 *
 * @throws AppError 400 `"Product id is required"` when `productId` is missing
 * or blank.
 * @throws AppError 400 `"Quantity must be at least 1"` when `quantity` is not
 * a number or is below 1.
 * @throws AppError 404 `"Product not found"` when no active product has that
 * id.
 * @throws AppError 400 `"Color is required"` / `"Selected color is invalid"` /
 * `"Size is required"` / `"Selected size is invalid"` from
 * {@link getSelectedvariant}.
 * @throws AppError 400 `"Quantity is more than the stock of this product"`
 * when the requested amount, or the resulting row total, exceeds stock.
 */
customerCartWishlistRouter.post(
  "/cart/items",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    const productId = String(req.body.productId || "").trim();
    const quantity = Number(req.body.quantity || 1);
    const colorValue = String(req.body.color || "").trim();
    const sizeValue = String(req.body.size || "").trim();

    requireText(productId, "Product id is required");

    if (Number.isNaN(quantity) || quantity < 1) {
      throw new AppError(400, "Quantity must be at least 1");
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    const foundProduct = requireFound(product, "Product not found", 404);

    const { color, size } = getSelectedvariant(
      foundProduct,
      colorValue,
      sizeValue,
    );

    if (quantity > foundProduct.stock) {
      throw new AppError(
        400,
        "Quantity is more than the stock of this product",
      );
    }

    let cart = await Cart.findOne({ user: dbUser._id });

    if (!cart) {
      cart = await Cart.create({
        user: dbUser._id,
        items: [],
      });
    }

    const itemIndex = cart.items.findIndex((item: CartItem) =>
      isSameCartItem(item, String(foundProduct._id), color, size),
    );

    if (itemIndex > 0) {
      const nextQuantity = cart.items[itemIndex].quantity + quantity;

      if (nextQuantity > foundProduct.stock) {
        throw new AppError(
          400,
          "Quantity is more than the stock of this product",
        );
      }

      cart.items[itemIndex].quantity = nextQuantity;
    } else {
      cart.items.push({
        product: foundProduct._id,
        quantity,
        color,
        size,
      });
    }

    await cart.save();

    res.json(ok(await getCartResponse(String(dbUser._id))));
  }),
);

/**
 * `PATCH /customer/cart/items/:productId/increase` — adds one to a cart row
 * and returns the whole cart.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Path parameter `productId`. The variant comes from the **query string** —
 * `?color=...&size=...` — not the body, unlike `POST /cart/items`. Sending
 * them in the body leaves them empty, which is rejected for any product that
 * defines variants.
 *
 * The row is matched on product *and* variant, so increasing the red one does
 * not touch the blue one. The product must still be active, and the new
 * quantity must not exceed its stock; there is no upper bound other than
 * stock.
 *
 * A caller with no cart at all gets a 404 here, where `DELETE` answers 200
 * with an empty cart.
 *
 * Side effects: writes the `carts` document.
 *
 * @throws AppError 400 `"Product id is required"` when the path parameter is
 * blank.
 * @throws AppError 404 `"Cart not found"` when the caller has no cart
 * document.
 * @throws AppError 404 `"Product not found"` when no active product has that
 * id.
 * @throws AppError 400 `"Color is required"` / `"Selected color is invalid"` /
 * `"Size is required"` / `"Selected size is invalid"` from
 * {@link getSelectedvariant}.
 * @throws AppError 400 `"Cart item not found here"` when the cart holds no row
 * for that product and variant.
 * @throws AppError 400 `"Quantity is more than the stock of this product"`
 * when one more would exceed stock.
 */
customerCartWishlistRouter.patch(
  "/cart/items/:productId/increase",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const productId = String(req.params.productId || "").trim();
    const colorValue = String(req.query.color || "").trim();
    const sizeValue = String(req.query.size || "").trim();

    requireText(productId, "Product id is required");

    const cart = await Cart.findOne({ user: dbUser._id });
    const foundCart = requireFound(cart, "Cart not found", 404);

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    const foundProduct = requireFound(product, "Product not found", 404);

    const { color, size } = getSelectedvariant(
      foundProduct,
      colorValue,
      sizeValue,
    );

    const itemIndex = cart.items.findIndex((item: CartItem) =>
      isSameCartItem(item, String(foundProduct._id), color, size),
    );

    if (itemIndex < 0) {
      throw new AppError(400, "Cart item not found here");
    }

    if (foundCart.items[itemIndex].quantity + 1 > foundProduct.stock) {
      throw new AppError(
        400,
        "Quantity is more than the stock of this product",
      );
    }

    foundCart.items[itemIndex].quantity += 1;

    await foundCart.save();

    res.json(ok(await getCartResponse(String(dbUser._id))));
  }),
);

/**
 * `PATCH /customer/cart/items/:productId/decrease` — takes one off a cart row,
 * removing the row at zero, and returns the whole cart.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Path parameter `productId`, with the variant in the **query string**
 * (`?color=...&size=...`), exactly as for increase.
 *
 * Dropping to zero or below splices the row out entirely, so there is no
 * separate "remove" call for the last unit and the response simply comes back
 * without that row.
 *
 * The product is still looked up and must still be active, purely so the
 * variant can be validated — so a row for a product that has since been
 * archived cannot be decremented, only deleted through `DELETE`.
 *
 * Side effects: writes the `carts` document.
 *
 * @throws AppError 400 `"Product id is required"` when the path parameter is
 * blank.
 * @throws AppError 404 `"Cart not found"` when the caller has no cart
 * document.
 * @throws AppError 404 `"Product not found"` when no active product has that
 * id.
 * @throws AppError 400 `"Color is required"` / `"Selected color is invalid"` /
 * `"Size is required"` / `"Selected size is invalid"` from
 * {@link getSelectedvariant}.
 * @throws AppError 400 `"Cart item not found here"` when the cart holds no row
 * for that product and variant.
 */
customerCartWishlistRouter.patch(
  "/cart/items/:productId/decrease",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const productId = String(req.params.productId || "").trim();
    const colorValue = String(req.query.color || "").trim();
    const sizeValue = String(req.query.size || "").trim();

    requireText(productId, "Product id is required");

    const cart = await Cart.findOne({ user: dbUser._id });
    const foundCart = requireFound(cart, "Cart not found", 404);

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    const foundProduct = requireFound(product, "Product not found", 404);

    const { color, size } = getSelectedvariant(
      foundProduct,
      colorValue,
      sizeValue,
    );

    const itemIndex = cart.items.findIndex((item: CartItem) =>
      isSameCartItem(item, String(foundProduct._id), color, size),
    );

    if (itemIndex < 0) {
      throw new AppError(400, "Cart item not found here");
    }

    foundCart.items[itemIndex].quantity -= 1;

    if (foundCart.items[itemIndex].quantity <= 0) {
      foundCart.items.splice(itemIndex, 1);
    }

    await foundCart.save();

    res.json(ok(await getCartResponse(String(dbUser._id))));
  }),
);

/**
 * `DELETE /customer/cart/items/:productId` — removes one cart row outright and
 * returns the whole cart.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Path parameter `productId`, with the variant in the **query string**
 * (`?color=...&size=...`). Only the row matching that product and variant is
 * removed; other variants of the same product stay.
 *
 * A caller with no cart document gets `200` with `{ items: [],
 * totalQuantity: 0 }` and nothing is written — unlike increase and decrease,
 * which answer 404.
 *
 * The product must still exist and be active, so a row whose product was later
 * archived cannot be removed through this route. Removing a row that is not
 * there is not an error: the filter simply matches nothing and the cart is
 * saved unchanged.
 *
 * Side effects: writes the `carts` document, except on the no-cart path.
 *
 * @throws AppError 400 `"Product id is required"` when the path parameter is
 * blank.
 * @throws AppError 404 `"Product not found"` when no active product has that
 * id.
 * @throws AppError 400 `"Color is required"` / `"Selected color is invalid"` /
 * `"Size is required"` / `"Selected size is invalid"` from
 * {@link getSelectedvariant}.
 */
customerCartWishlistRouter.delete(
  "/cart/items/:productId",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const productId = String(req.params.productId || "").trim();
    const colorValue = String(req.query.color || "").trim();
    const sizeValue = String(req.query.size || "").trim();

    requireText(productId, "Product id is required");

    const cart = await Cart.findOne({ user: dbUser._id });

    if (!cart) {
      res.json(ok({ items: [], totalQuantity: 0 }));
      return;
    }

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    const foundProduct = requireFound(product, "Product not found", 404);

    const { color, size } = getSelectedvariant(
      foundProduct,
      colorValue,
      sizeValue,
    );

    cart.items = cart.items.filter(
      (item: CartItem) => !isSameCartItem(item, productId, color, size),
    );

    await cart.save();
    res.json(ok(await getCartResponse(String(dbUser._id))));
  }),
);

/**
 * `POST /customer/cart/sync` — merges a client-side guest cart into the stored
 * cart.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `{ items: [{ productId, quantity, color, size }] }`. A body without an
 * `items` array is treated as an empty list rather than rejected. Variants are
 * read from the body here, not the query string.
 *
 * Merge, not replace: quantities are added to any matching row, and the result
 * is clamped to the product's stock rather than refused, so a sync never
 * fails on stock.
 *
 * Rows are dropped silently and individually — no error, no report of what was
 * skipped — when the `productId` is blank, the quantity is not a number or is
 * below 1, the product is missing or not active, its stock is below 1, or the
 * colour/size fails validation. That last case is swallowed by a bare `catch`,
 * so the variant errors from {@link getSelectedvariant} never reach the
 * caller from this route.
 *
 * Known defects, documented rather than fixed. Both make the route unusable as
 * written:
 *
 * - With no existing cart it calls `cart.create(...)` on the `null` it has
 *   just tested for, which is a `TypeError` and so a 500.
 * - `cart.save()` and `res.json()` are both inside the per-item loop, so a
 *   two-item sync writes the response twice and Express logs
 *   `ERR_HTTP_HEADERS_SENT`, while an empty `items` array writes no response
 *   at all and the request hangs until the client times out.
 *
 * The handler raises no `AppError` of its own, so there are no 4xx responses
 * to document beyond the router guard's 401.
 *
 * Side effects: intended to create and write the `carts` document; in practice
 * it writes once per accepted row.
 */
customerCartWishlistRouter.post(
  "/cart/sync",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    const incomingItems = Array.isArray(req.body.items)
      ? (req.body.items as SyncCartItemInput[])
      : [];

    let cart = await Cart.findOne({ user: dbUser._id });

    if (!cart) {
      cart = await cart.create({
        user: dbUser._id,
        items: [],
      });
    }

    for (const rawItem of incomingItems) {
      const productId = String(rawItem.productId || "").trim();
      const quantity = Number(rawItem.quantity || 0);
      const colorValue = String(rawItem.color || "").trim();
      const sizeValue = String(rawItem.size || "").trim();

      if (!productId || Number.isNaN(quantity) || quantity < 1) {
        continue;
      }

      const product = await Product.findOne({
        _id: productId,
        status: "active",
      });

      if (!product || product.stock < 1) {
        continue;
      }

      try {
        const { color, size } = getSelectedvariant(
          product,
          colorValue,
          sizeValue,
        );

        const itemIndex = cart.items.findIndex((item: CartItem) =>
          isSameCartItem(item, String(product._id), color, size),
        );

        if (itemIndex >= 0) {
          const nextQuantity = cart.items[itemIndex].quantity + quantity;

          cart.items[itemIndex].quantity = Math.min(
            nextQuantity,
            product.stock,
          );
        } else {
          cart.items.push({
            product: product._id,
            quantity: Math.min(quantity, product.stock),
            color,
            size,
          });
        }
      } catch {
        continue;
      }

      await cart.save();

      res.json(ok(await getCartResponse(String(dbUser._id))));
    }
  }),
);

/**
 * `GET /customer/wishlist` — returns the caller's wishlist.
 *
 * @remarks
 * Auth: signed-in customer. No parameters are read.
 *
 * Unlike the cart routes, this one is reached by the shipped mobile app.
 *
 * A caller who has never saved anything gets `{ items: [] }` rather than a
 * 404, and no wishlist document is created by reading. Entries whose product
 * has been deleted are absent from the response.
 */
customerCartWishlistRouter.get(
  "/wishlist",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    res.json(ok(await getWishlistResponse(String(dbUser._id))));
  }),
);

/**
 * `POST /customer/wishlist/items` — saves a product to the caller's wishlist
 * and returns the whole wishlist.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `productId` only. A wishlist holds products, not variants, so `color`
 * and `size` are neither read nor stored — the same product in two colours is
 * one entry.
 *
 * Only a product with `status: "active"` can be saved; anything else is
 * reported as not found.
 *
 * Adding a product already on the list is a no-op that still answers 200 with
 * the list, and in that case nothing is written, so the route is safe to
 * repeat.
 *
 * Side effects: creates the `wishlists` document when the caller has none,
 * then writes it only if the product was not already present.
 *
 * @throws AppError 400 `"Product id is required"` when `productId` is missing
 * or blank.
 * @throws AppError 404 `"Product not found"` when no active product has that
 * id.
 */
customerCartWishlistRouter.post(
  "/wishlist/items",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const productId = String(req.body.productId || "").trim();

    requireText(productId, "Product id is required");

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    });

    const foundProduct = requireFound(product, "Product not found", 404);

    let wishlist = await Wishlist.findOne({ user: dbUser._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: dbUser._id,
        products: [],
      });
    }

    const exists = wishlist.products.some(
      (item: Types.ObjectId) => String(item) === String(foundProduct._id),
    );

    if (!exists) {
      wishlist.products.push(foundProduct._id);
      await wishlist.save();
    }

    res.json(ok(await getWishlistResponse(String(dbUser._id))));
  }),
);

/**
 * `DELETE /customer/wishlist/items/:productId` — removes a product from the
 * caller's wishlist and returns the whole wishlist.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `productId`; no body or query is
 * read.
 *
 * This is the one route here that does not look the product up, so an id for a
 * product that has since been deleted or archived is still removed cleanly.
 * Removing something that is not on the list is not an error either — the
 * filter matches nothing and the document is saved unchanged.
 *
 * A caller with no wishlist document gets `200` with `{ items: [] }` and
 * nothing is written.
 *
 * Side effects: writes the `wishlists` document, except on the no-wishlist
 * path.
 *
 * @throws AppError 400 `"Product id is required"` when the path parameter is
 * blank.
 */
customerCartWishlistRouter.delete(
  "/wishlist/items/:productId",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const productId = String(req.params.productId || "").trim();

    requireText(productId, "Product id is required");

    let wishlist = await Wishlist.findOne({ user: dbUser._id });

    if (!wishlist) {
      res.json(ok({ items: [] }));
      return;
    }

    wishlist.products = wishlist.products.filter(
      (item: Types.ObjectId) => String(item) !== productId,
    );

    await wishlist.save();

    res.json(ok(await getWishlistResponse(String(dbUser._id))));
  }),
);
