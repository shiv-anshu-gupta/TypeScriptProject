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
