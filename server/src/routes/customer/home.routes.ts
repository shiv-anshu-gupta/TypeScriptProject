/**
 * The single payload behind the app's home screen.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, giving the one route
 * `GET /customer/home`.
 *
 * The route is public — no `requireAuth` — because the home screen is the
 * first thing the app draws, before Clerk has produced a token.
 *
 * This is one of only two bounded reads in the API: eight banners, four
 * products and four coupons. Everything it returns is shaped by hand rather
 * than by the shared product and category mappers, so the keys here do not
 * match `/customer/products` or `/customer/categories`.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  Banner,
  HOME_BANNER_LIMIT,
  liveBannerFilter,
  type BannerLink,
} from "../../models/Banner";
import { Category } from "../../models/Category";
import { Product } from "../../models/Product";
import { Promo } from "../../models/Promo";
import { ok } from "../../utils/envelope";
import { cdnImage } from "../../utils/cloudinary";

type BannerRow = {
  _id: Types.ObjectId;
  imageUrl: string;
  title?: string;
  link?: BannerLink;
  createdAt: Date;
};

/**
 * Turns stored banner rows into the carousel entries the app draws, checking
 * each tap target still exists.
 *
 * @remarks
 * Produces `{ _id, imageUrl, title, link, createdAt }` per banner. `_id` is
 * stringified, `imageUrl` is rewritten to the 1200 px `banner` CDN variant,
 * `title` falls back to `""`, and `createdAt` becomes an ISO string. The
 * stored `imagePublicId`, `isActive`, `sortOrder`, `startsAt` and `endsAt`
 * are deliberately omitted — the caller has already filtered on them.
 *
 * `link` is always present. A `category` or `product` link keeps its
 * `targetId` only when that record is still there, and a product must also
 * still be `active`; anything else collapses to `{ type: "none" }`. Link
 * types that need no target (`none`, `writeList`, `shop`) are passed through
 * with the `type` alone, so `targetId` is absent rather than null.
 *
 * Two lookups at most, batched with `$in`, and skipped entirely when no
 * banner uses that link type.
 *
 * @param banners - Live banner rows, already sorted and limited.
 * @returns The carousel entries, in the order given.
 */
// A banner's tap action, dropped to "none" when what it points at has since
// been deleted or hidden - a tap should never land on an empty page.
async function resolveBannerLinks(banners: BannerRow[]) {
  const ids = (type: "category" | "product") =>
    banners
      .filter((b) => b.link?.type === type && b.link.targetId)
      .map((b) => b.link?.targetId as string);

  const [categories, products] = await Promise.all([
    ids("category").length
      ? Category.find({ _id: { $in: ids("category") } }).select("_id").lean<{ _id: Types.ObjectId }[]>()
      : [],
    ids("product").length
      ? Product.find({ _id: { $in: ids("product") }, status: "active" }).select("_id").lean<{ _id: Types.ObjectId }[]>()
      : [],
  ]);
  const alive = new Set([...categories, ...products].map((row) => String(row._id)));

  return banners.map((banner) => {
    const type = banner.link?.type ?? "none";
    const targetId = banner.link?.targetId;
    const needsTarget = type === "category" || type === "product";
    const link: BannerLink =
      needsTarget && (!targetId || !alive.has(targetId))
        ? { type: "none" }
        : needsTarget
          ? { type, targetId }
          : { type };
    return {
      _id: String(banner._id),
      imageUrl: cdnImage(banner.imageUrl, "banner"),
      title: banner.title ?? "",
      link,
      createdAt: banner.createdAt.toISOString(),
    };
  });
}

type CategoryRow = {
  _id: Types.ObjectId;
  name: string;
  imageUrl?: string;
};

type ProductRow = {
  _id: Types.ObjectId;
  title: string;
  brand: string;
  unit: string;
  unitValue?: number;
  images: Array<{
    url: string;
    isCover?: boolean;
  }>;
  createdAt: Date;
};

type PromoRow = {
  _id: Types.ObjectId;
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  endsAt: Date;
};

export const customerHomeRouter = Router();

/**
 * `GET /customer/home` — banners, categories, the newest products and the
 * live coupons, in one response.
 *
 * @remarks
 * Auth: public. No parameters.
 *
 * Four independent queries run in parallel:
 *
 * - `banners` — those live at this instant (`isActive` not false, and inside
 *   any `startsAt`/`endsAt` window), ordered by `sortOrder` then newest,
 *   capped at `HOME_BANNER_LIMIT`. Tap targets are then checked by
 *   `resolveBannerLinks`.
 * - `categories` — all of them, A to Z, with 200 px `thumb` images.
 * - `recentProducts` — the four newest `active` products, with 500 px `card`
 *   images. The cover image is used, falling back to the first image, then to
 *   `""` for a product with none.
 * - `coupons` — promos whose window covers now and whose `count` is above
 *   zero, capped at four.
 *
 * Two naming traps for callers. The product timestamp is emitted as
 * `createAt`, without the "e" — it is a mapper key, not the `createdAt` field
 * on the document. The coupon query sorts by that same misspelling, which is
 * not a field on `Promo`, so which four live coupons come back is
 * unspecified rather than "the newest four".
 *
 * `unitValue` falls back to 1 when a product does not set one.
 *
 * Side effects: none.
 */
customerHomeRouter.get(
  "/home",
  asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date();

    const [banners, categories, recentProducts, promos] = await Promise.all([
      Banner.find(liveBannerFilter(now))
        .sort({ sortOrder: 1, createdAt: -1 })
        .limit(HOME_BANNER_LIMIT)
        .lean<BannerRow[]>(),
      Category.find().sort({ name: 1 }).lean<CategoryRow[]>(),
      Product.find({ status: "active" })
        .select("title brand unit unitValue images createdAt")
        .sort({ createdAt: -1 })
        .limit(4)
        .lean<ProductRow[]>(),
      Promo.find({
        startsAt: { $lte: now },
        endsAt: { $gte: now },
        count: { $gt: 0 },
      })
        .sort({ createAt: -1 })
        .limit(4)
        .lean<PromoRow[]>(),
    ]);

    res.json(
      ok({
        banners: await resolveBannerLinks(banners),
        categories: categories.map((categoryItem) => ({
          _id: String(categoryItem._id),
          name: categoryItem.name,
          imageUrl: cdnImage(categoryItem.imageUrl || "", "thumb"),
        })),
        recentProducts: recentProducts.map((recentProductItem) => {
          const image = cdnImage(
            recentProductItem.images.find((item) => item.isCover)?.url ||
              recentProductItem.images[0]?.url ||
              "",
            "card",
          );

          return {
            _id: String(recentProductItem._id),
            title: recentProductItem.title,
            brand: recentProductItem.brand,
            image,
            unit: recentProductItem.unit,
            unitValue: recentProductItem.unitValue ?? 1,
            createAt: recentProductItem.createdAt.toISOString(),
          };
        }),
        coupons: promos.map((promoItem) => ({
          _id: String(promoItem._id),
          code: promoItem.code,
          percentage: promoItem.percentage,
          count: promoItem.count,
          minimumOrderValue: promoItem.minimumOrderValue,
          endsAt: promoItem.endsAt.toISOString(),
        })),
      }),
    );
  }),
);
