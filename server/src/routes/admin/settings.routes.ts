import { getDbUserFromReq, requireAdmin } from "../../middleware/auth";
import multer from "multer";
import { isValidObjectId } from "mongoose";
import {
  Banner,
  BANNER_LINK_TYPES,
  HOME_BANNER_LIMIT,
  type BannerDocument,
  type BannerLink,
  type BannerLinkType,
} from "../../models/Banner";
import { Category } from "../../models/Category";
import { Product } from "../../models/Product";
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { cdnImage } from "../../utils/cloudinary";
import { AppError } from "../../utils/AppError";
import { cleanField } from "../../utils/sanitizeItem";
import {
  deleteFromCloudinary,
  uploadManyBuffersToCloudinary,
} from "../../utils/cloudinary";

type AdminBannerItem = {
  _id: string;
  imageUrl: string;
  imagePublicId: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  link: { type: BannerLinkType; targetId?: string; targetName?: string };
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

const BANNER_FOLDER = "ecommerce-monster-video/banners";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_TITLE = 80;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, done) => {
    if (ALLOWED_TYPES.has(file.mimetype)) done(null, true);
    else done(new AppError(400, "Only JPG, PNG or WebP images can be banners"));
  },
});

// Multer reports limits as its own error type; turn those into a clear 400.
function acceptImages(req: Request, res: Response, next: NextFunction) {
  upload.array("images", MAX_FILES)(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Each banner image must be under 5 MB"
          : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
            ? `Upload at most ${MAX_FILES} images at a time`
            : "Couldn't read the uploaded images";
      return next(new AppError(400, message));
    }
    next(err);
  });
}

// A file name makes a reasonable starting title: "diwali-offer_2.png" ->
// "diwali offer 2". The admin can rename it.
function titleFromFileName(name: string) {
  return cleanField(name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), MAX_TITLE);
}

async function targetNames(items: BannerDocument[]) {
  const categoryIds = items
    .filter((b) => b.link?.type === "category" && b.link.targetId)
    .map((b) => b.link.targetId as string);
  const productIds = items
    .filter((b) => b.link?.type === "product" && b.link.targetId)
    .map((b) => b.link.targetId as string);

  const [categories, products] = await Promise.all([
    categoryIds.length
      ? Category.find({ _id: { $in: categoryIds } }).select("name").lean<{ _id: unknown; name: string }[]>()
      : [],
    productIds.length
      ? Product.find({ _id: { $in: productIds } }).select("title").lean<{ _id: unknown; title: string }[]>()
      : [],
  ]);

  const names = new Map<string, string>();
  categories.forEach((c) => names.set(String(c._id), c.name));
  products.forEach((p) => names.set(String(p._id), p.title));
  return names;
}

function mapBanner(item: BannerDocument, names: Map<string, string>): AdminBannerItem {
  const type = item.link?.type ?? "none";
  const targetId = item.link?.targetId || undefined;
  return {
    _id: String(item._id),
    // The shop sees the same picture the app will, at the same size.
    imageUrl: cdnImage(item.imageUrl, "banner"),
    imagePublicId: item.imagePublicId,
    title: item.title ?? "",
    isActive: item.isActive !== false,
    sortOrder: item.sortOrder ?? 0,
    link: {
      type,
      ...(targetId ? { targetId, targetName: names.get(targetId) } : {}),
    },
    startsAt: item.startsAt ? item.startsAt.toISOString() : null,
    endsAt: item.endsAt ? item.endsAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
  };
}

// All banners in carousel order. Banners saved before ordering existed all
// share position 0 - give them real, distinct positions once (newest first,
// matching how the app used to show them).
async function listBanners(): Promise<AdminBannerItem[]> {
  let items: BannerDocument[] = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });

  const positions = new Set(items.map((b) => b.sortOrder ?? 0));
  if (positions.size !== items.length) {
    await Banner.bulkWrite(
      items.map((b, index) => ({
        updateOne: { filter: { _id: b._id }, update: { $set: { sortOrder: index } } },
      })),
    );
    items = await Banner.find().sort({ sortOrder: 1, createdAt: -1 });
  }

  const names = await targetNames(items);
  return items.map((b) => mapBanner(b, names));
}

async function readLink(raw: unknown): Promise<BannerLink> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const type = cleanField(body.type, 20) as BannerLinkType;
  if (!BANNER_LINK_TYPES.includes(type)) {
    throw new AppError(400, "Choose what the banner opens");
  }
  if (type !== "category" && type !== "product") return { type };

  const targetId = cleanField(body.targetId, 40);
  if (!isValidObjectId(targetId)) {
    throw new AppError(400, `Pick the ${type} this banner opens`);
  }
  const exists =
    type === "category"
      ? await Category.exists({ _id: targetId })
      : await Product.exists({ _id: targetId });
  if (!exists) {
    throw new AppError(400, `That ${type} no longer exists`);
  }
  return { type, targetId };
}

function readDate(raw: unknown, label: string): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") throw new AppError(400, `Invalid ${label}`);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new AppError(400, `Invalid ${label}`);
  return date;
}

export const adminSettingsRouter = Router();

adminSettingsRouter.use(requireAdmin);

adminSettingsRouter.get(
  "/settings/banners",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(ok({ items: await listBanners(), limit: HOME_BANNER_LIMIT }));
  }),
);

// Upload one or more images; each becomes a banner at the end of the list.
adminSettingsRouter.post(
  "/settings/banners",
  acceptImages,
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const files = (req.files || []) as Express.Multer.File[];

    if (!files.length) {
      throw new AppError(400, "Choose at least one image");
    }

    const uploaded = await uploadManyBuffersToCloudinary(
      files.map((file) => file.buffer),
      BANNER_FOLDER,
    );

    const last = await Banner.findOne().sort({ sortOrder: -1 }).select("sortOrder");
    const start = last ? (last.sortOrder ?? 0) + 1 : 0;

    await Banner.insertMany(
      uploaded.map((image, index) => ({
        imageUrl: image.url,
        imagePublicId: image.publicId,
        title: titleFromFileName(files[index]?.originalname ?? ""),
        sortOrder: start + index,
        createdBy: dbUser._id,
      })),
    );

    res.json(ok({ items: await listBanners(), limit: HOME_BANNER_LIMIT }));
  }),
);

// New carousel order: the full list of banner ids, first to last.
adminSettingsRouter.put(
  "/settings/banners/order",
  asyncHandler(async (req: Request, res: Response) => {
    const ids: unknown = req.body?.ids;
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && isValidObjectId(id))) {
      throw new AppError(400, "Send the banner ids in their new order");
    }

    const all = await Banner.find().select("_id");
    const known = new Set(all.map((b) => String(b._id)));
    const unique = new Set(ids as string[]);
    if (unique.size !== ids.length || unique.size !== known.size || [...unique].some((id) => !known.has(id))) {
      throw new AppError(409, "The banner list changed - refresh and try again");
    }

    await Banner.bulkWrite(
      (ids as string[]).map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index } } },
      })),
    );

    res.json(ok({ items: await listBanners(), limit: HOME_BANNER_LIMIT }));
  }),
);

// Edit a banner's title, visibility, tap action or schedule. Only the fields
// sent are changed.
adminSettingsRouter.patch(
  "/settings/banners/:bannerId",
  asyncHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    if (!isValidObjectId(bannerId)) throw new AppError(404, "Banner not found");

    const banner: BannerDocument | null = await Banner.findById(bannerId);
    if (!banner) throw new AppError(404, "Banner not found");

    const body = (req.body ?? {}) as Record<string, unknown>;

    if ("title" in body) banner.title = cleanField(body.title, MAX_TITLE);
    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") throw new AppError(400, "Invalid visibility");
      banner.isActive = body.isActive;
    }
    if ("link" in body) banner.link = await readLink(body.link);
    if ("startsAt" in body) banner.startsAt = readDate(body.startsAt, "start date");
    if ("endsAt" in body) banner.endsAt = readDate(body.endsAt, "end date");

    if (banner.startsAt && banner.endsAt && banner.endsAt <= banner.startsAt) {
      throw new AppError(400, "The end date must be after the start date");
    }

    await banner.save();
    res.json(ok({ items: await listBanners(), limit: HOME_BANNER_LIMIT }));
  }),
);

adminSettingsRouter.delete(
  "/settings/banners/:bannerId",
  asyncHandler(async (req: Request, res: Response) => {
    const { bannerId } = req.params;
    if (!isValidObjectId(bannerId)) throw new AppError(404, "Banner not found");

    const banner: BannerDocument | null = await Banner.findByIdAndDelete(bannerId);
    if (!banner) throw new AppError(404, "Banner not found");

    // The banner is already gone from the app; a failed image clean-up only
    // leaves an unused file in Cloudinary, so it must not fail the request.
    try {
      await deleteFromCloudinary([banner.imagePublicId]);
    } catch (error) {
      console.error("banner image cleanup failed", banner.imagePublicId, error);
    }

    res.json(ok({ items: await listBanners(), limit: HOME_BANNER_LIMIT }));
  }),
);
