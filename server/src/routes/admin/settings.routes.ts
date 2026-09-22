/**
 * Shop settings: the home-screen banner carousel.
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, so the paths below are
 * `/admin/settings/banners*`. Each route asks for `settings:manage`,
 * so every route needs a signed-in user whose `users` record has
 * `role: "admin"`; a signed-in customer gets 403, not 404.
 *
 * The router owns the whole `banners` collection and the Cloudinary folder
 * `ecommerce-monster-video/banners` behind it. There is no per-banner GET:
 * every route, including the mutations, answers with the full list plus
 * `limit`, so the admin panel can replace its table outright after any change.
 *
 * `limit` is `HOME_BANNER_LIMIT` — how many live banners the app's carousel
 * shows, not a cap on how many may be stored. The server never enforces it on
 * upload, so an admin can store more than the app will ever display.
 *
 * Banner order is a dense `sortOrder` maintained by this router alone; see
 * {@link listBanners} for the one place it is repaired.
 *
 * @packageDocumentation
 */
import { getDbUserFromReq } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
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

/**
 * Multer instance for banner uploads: memory storage, capped at
 * `MAX_FILE_BYTES` per file and `MAX_FILES` files, JPEG/PNG/WebP only.
 *
 * @remarks
 * Memory storage is deliberate — the buffers go straight to Cloudinary and
 * nothing is written to disk, which matters on a serverless host with no
 * writable filesystem. It also means the whole batch sits in process memory at
 * once, which is what the size and count caps bound.
 *
 * The filter rejects on MIME type as the browser reports it, not on file
 * contents or extension. Its `AppError` surfaces through {@link acceptImages}.
 *
 * Only the `images` field is accepted; any other file field is a
 * `LIMIT_UNEXPECTED_FILE`.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, done) => {
    if (ALLOWED_TYPES.has(file.mimetype)) done(null, true);
    else done(new AppError(400, "Only JPG, PNG or WebP images can be banners"));
  },
});

/**
 * Express middleware that parses the `images` multipart field and populates
 * `req.files` with in-memory buffers.
 *
 * @remarks
 * Wraps `upload.array("images", MAX_FILES)` so that each `MulterError` code
 * becomes an `AppError` a shop owner can act on: over-size, too many files or
 * an unexpected field name, and a catch-all for anything else. Errors that are
 * not `MulterError`s — including the `AppError` the file filter throws for a
 * rejected MIME type — pass through to `next` untouched, so they keep their
 * own message and status.
 *
 * An empty upload is not an error here; the route checks `req.files.length`.
 *
 * @param req - Populated with `req.files` on success.
 * @param next - Called with an `AppError 400` for every multer limit.
 */
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

/**
 * Derives a banner title from an uploaded file's original name.
 *
 * @remarks
 * Drops the last extension only, collapses runs of `-` and `_` to single
 * spaces, then puts the result through `cleanField` with a `MAX_TITLE`
 * character cap, which strips dangerous characters and trims. Case is left
 * alone, so `Diwali-Offer.png` keeps its capitals.
 *
 * A name that is empty, or that cleans down to nothing, yields `""` — a valid
 * banner title, since the title is optional.
 *
 * @param name - The client-supplied `originalname`; never trusted as a path.
 * @returns The starting title, at most `MAX_TITLE` characters.
 */
// A file name makes a reasonable starting title: "diwali-offer_2.png" ->
// "diwali offer 2". The admin can rename it.
function titleFromFileName(name: string) {
  return cleanField(name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), MAX_TITLE);
}

/**
 * Resolves the display names of everything the given banners link to.
 *
 * @remarks
 * Two batched queries — one for categories, one for products — rather than a
 * lookup per banner, and each is skipped entirely when no banner links to that
 * kind. Only `name` / `title` is selected; the documents are `lean`.
 *
 * Both kinds share one map keyed by the stringified id, which is safe because
 * category and product ids never collide.
 *
 * A target that no longer exists is simply absent from the map, so
 * {@link mapBanner} emits a `targetId` with no `targetName` rather than
 * failing. Banners linking to `none`, `writeList` or `shop` are ignored.
 *
 * @param items - The banners about to be mapped.
 * @returns Target id to display name; may be smaller than the number of
 * linking banners.
 */
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

/**
 * Shapes one banner document into the `AdminBannerItem` sent to the admin
 * panel.
 *
 * @remarks
 * Every optional field is given a concrete value so the client never has to
 * test for `undefined`: a missing `link` becomes `{ type: "none" }`, a missing
 * `title` becomes `""`, a missing `sortOrder` becomes `0`, and `isActive` is
 * `true` unless it is explicitly `false`, so a record saved before the flag
 * existed reads as visible.
 *
 * `targetId` and `targetName` are present only for a `category` or `product`
 * link, and `targetName` is `undefined` when the target has been deleted.
 *
 * Dates go out as ISO strings, with `null` — not an omitted key — for an
 * unset schedule.
 *
 * `imagePublicId` is returned raw for the admin panel's use, while `imageUrl`
 * is rewritten by `cdnImage`, so the two no longer refer to the same URL.
 * `createdBy` and `updatedAt` are deliberately omitted.
 *
 * @param item - The banner document.
 * @param names - The map from {@link targetNames}.
 * @returns One row of the admin banner list.
 */
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

/**
 * Builds the banner list that every route in this file returns.
 *
 * @remarks
 * Sorted by `sortOrder` ascending, then newest first as a tie-break, and
 * unpaginated — the whole collection comes back each time.
 *
 * Hidden and expired banners are included. This is the admin view, so nothing
 * is filtered by `isActive` or by the `startsAt` / `endsAt` window; the app's
 * own feed applies `liveBannerFilter` separately.
 *
 * Side effects: not a pure read. When any two banners share a `sortOrder`, the
 * whole collection is renumbered by a `bulkWrite` and re-read before mapping,
 * so a plain `GET /admin/settings/banners` can write to the database. The
 * repair is one-shot: once positions are distinct the check costs one `Set`
 * and nothing is written. Two admins loading the page at the same instant can
 * both run it, but both write the same positions.
 *
 * @returns The mapped list, already carrying resolved link target names.
 */
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

/**
 * Validates a banner's tap action and returns the `BannerLink` to store.
 *
 * @remarks
 * A `raw` that is not an object — `null`, a string, `undefined` — is treated
 * as `{}`, which fails the type check, so there is no silent default.
 *
 * `type` must be one of `BANNER_LINK_TYPES`. For `none`, `writeList` and
 * `shop` the function returns immediately and any `targetId` sent alongside is
 * dropped, so switching a banner away from a category link clears the target
 * rather than leaving it stranded.
 *
 * For `category` and `product` the `targetId` must both be a valid ObjectId
 * and still exist, checked with an `exists` query against the matching
 * collection. The existence check is a point-in-time read, not a foreign key:
 * a category deleted afterwards leaves the banner pointing at nothing, which
 * {@link targetNames} then renders without a `targetName`.
 *
 * @param raw - The `link` value from the request body.
 * @returns The link to store; `targetId` only for `category` and `product`.
 * @throws AppError 400 `"Choose what the banner opens"` when `type` is missing
 * or not a known link type.
 * @throws AppError 400 `` `Pick the ${type} this banner opens` `` when the
 * target id is missing or not a valid ObjectId.
 * @throws AppError 400 `` `That ${type} no longer exists` `` when no such
 * category or product is in the database.
 */
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

/**
 * Reads one end of a banner's schedule, or `null` to clear it.
 *
 * @remarks
 * `null`, `undefined` and `""` all mean "no date" and return `null`, which is
 * how a caller clears a schedule: send the key with an empty string or `null`,
 * rather than omitting it, since an omitted key leaves the stored value alone.
 *
 * Anything that is not a string is rejected outright, so a numeric epoch is
 * not accepted. A string is parsed by `new Date`, which accepts far more than
 * ISO 8601 and interprets a date-only string as UTC midnight. The two ends are
 * validated independently; the ordering rule lives in the route.
 *
 * @param raw - The `startsAt` or `endsAt` value from the request body.
 * @param label - Interpolated into the error message, e.g. `"start date"`.
 * @returns The parsed date, or `null` to clear the field.
 * @throws AppError 400 `` `Invalid ${label}` `` when the value is a non-string
 * or an unparseable string.
 */
function readDate(raw: unknown, label: string): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") throw new AppError(400, `Invalid ${label}`);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new AppError(400, `Invalid ${label}`);
  return date;
}

export const adminSettingsRouter = Router();

// No router-wide gate. `router.use(...)` runs for every request that enters the
// router - including paths that belong to a DIFFERENT router mounted on the
// same "/admin" prefix - so a blanket guard here refused the shop's staff on
// routes this file knows nothing about. Each route below states its own
// permission instead.

/**
 * `GET /admin/settings/banners` — returns every banner in carousel order,
 * with the app's carousel cap.
 *
 * @remarks
 * Auth: admin. No parameters are read; there is no paging and no filter, so
 * hidden and expired banners are included.
 *
 * `limit` in the response is `HOME_BANNER_LIMIT`, the number of live banners
 * the app's home carousel shows. It is advisory: nothing here refuses to store
 * more.
 *
 * Side effects: this GET can write. If two banners share a `sortOrder`,
 * {@link listBanners} renumbers the whole collection before answering. A
 * caller must therefore not treat it as a safe, repeatable read.
 */
adminSettingsRouter.get(
  "/settings/banners",
  requirePermission("settings:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(ok({ items: await listBanners(), limit: HOME_BANNER_LIMIT }));
  }),
);

/**
 * `POST /admin/settings/banners` — uploads images and creates one banner per
 * file, returning the full list.
 *
 * @remarks
 * Auth: admin.
 *
 * `multipart/form-data` with a repeated `images` field: 1 to `MAX_FILES`
 * files, each at most `MAX_FILE_BYTES`, MIME `image/jpeg`, `image/png` or
 * `image/webp`. Parsing and the limit errors are handled by
 * {@link acceptImages} before this handler runs.
 *
 * New banners are appended, not inserted: `sortOrder` continues from the
 * current maximum, so the carousel order of existing banners is untouched.
 * Ordering relies on `Promise.all` preserving input order, which is what lets
 * `files[index]` name the right upload.
 *
 * A new banner is live at once: `isActive` and the link type take their schema
 * defaults of visible and `none`, with a title guessed from the file name and
 * no schedule. Nothing enforces `HOME_BANNER_LIMIT` on upload, so an upload
 * can push an existing banner out of the app's carousel.
 *
 * `createdBy` records the admin's `users` `_id`; it is stored but never
 * returned.
 *
 * Side effects: uploads every buffer to Cloudinary under
 * `ecommerce-monster-video/banners`, then one `insertMany`. The two are not a
 * transaction: if the insert fails the images stay in Cloudinary as orphans.
 *
 * @throws AppError 400 `"Choose at least one image"` when the request carries
 * no `images` file.
 * @throws AppError 400 `"Only JPG, PNG or WebP images can be banners"` from
 * the {@link upload} file filter.
 * @throws AppError 400 `"Each banner image must be under 5 MB"` /
 * `"Upload at most 10 images at a time"` / `"Couldn't read the uploaded
 * images"` from {@link acceptImages}.
 */
// Upload one or more images; each becomes a banner at the end of the list.
adminSettingsRouter.post(
  "/settings/banners",
  requirePermission("settings:manage"),
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

/**
 * `PUT /admin/settings/banners/order` — rewrites the carousel order and
 * returns the full list.
 *
 * @remarks
 * Auth: admin.
 *
 * Body: `{ ids: [...] }` — every banner id, each a valid ObjectId, each
 * exactly once. The array is a whole-collection replacement, not a partial
 * reorder: a short list, a long list, a duplicate or an unknown id is all
 * refused. `sortOrder` is set to the array index, so the result is always
 * dense and distinct.
 *
 * The two failures are deliberately different. A malformed body is a 400,
 * while a well-formed list that no longer matches the collection is a 409 — an
 * admin whose page is stale because someone else added or deleted a banner is
 * told to refresh rather than shown a validation error.
 *
 * The check and the write are not atomic, so a banner created between them is
 * left at whatever `sortOrder` it was given.
 *
 * Side effects: one `bulkWrite` over the whole collection.
 *
 * @throws AppError 400 `"Send the banner ids in their new order"` when `ids`
 * is not an array or holds a non-string or non-ObjectId member.
 * @throws AppError 409 `"The banner list changed - refresh and try again"` on
 * duplicates, the wrong count, or an id that is not in the collection.
 */
// New carousel order: the full list of banner ids, first to last.
adminSettingsRouter.put(
  "/settings/banners/order",
  requirePermission("settings:manage"),
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

/**
 * `PATCH /admin/settings/banners/:bannerId` — updates one banner and returns
 * the full list.
 *
 * @remarks
 * Auth: admin. Path parameter `bannerId`; an id that is not a valid ObjectId
 * is reported as not found rather than as a bad request.
 *
 * Presence, not value, decides what changes: each field is tested with `in`,
 * so sending `title: ""` empties the title while omitting `title` leaves it
 * alone. That is also how a schedule is cleared — send `startsAt` or `endsAt`
 * as `null` or `""`; omitting the key keeps the stored date.
 *
 * `title` is capped at `MAX_TITLE` characters and cleaned. `isActive` must be
 * a real boolean, so `"true"` from a form is refused. `link` and the two dates
 * are validated by {@link readLink} and {@link readDate}.
 *
 * The ordering rule is checked against the merged result, not the request, so
 * sending only `startsAt` can still fail on an `endsAt` that was already
 * stored. It applies only when both ends are set; one-ended windows are
 * allowed.
 *
 * Neither the image nor `sortOrder` can be changed here — the image is fixed
 * at upload, and order goes through `PUT /settings/banners/order`.
 *
 * Side effects: one `save` on the `banners` document.
 *
 * @throws AppError 404 `"Banner not found"` when the id is malformed or no
 * such banner exists.
 * @throws AppError 400 `"Invalid visibility"` when `isActive` is present but
 * not a boolean.
 * @throws AppError 400 `"Choose what the banner opens"` / `` `Pick the ${type}
 * this banner opens` `` / `` `That ${type} no longer exists` `` from
 * {@link readLink}.
 * @throws AppError 400 `"Invalid start date"` / `"Invalid end date"` from
 * {@link readDate}.
 * @throws AppError 400 `"The end date must be after the start date"` when both
 * ends are set and `endsAt` is not later than `startsAt`.
 */
// Edit a banner's title, visibility, tap action or schedule. Only the fields
// sent are changed.
adminSettingsRouter.patch(
  "/settings/banners/:bannerId",
  requirePermission("settings:manage"),
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

/**
 * `DELETE /admin/settings/banners/:bannerId` — deletes one banner and returns
 * the full list.
 *
 * @remarks
 * Auth: admin. Path parameter `bannerId`; a malformed id is reported as not
 * found. No body or query is read, and the delete is unconditional — there is
 * no confirmation step and no soft delete, so hiding a banner means `PATCH`
 * with `isActive: false` instead.
 *
 * The remaining banners keep their `sortOrder` values, which leaves a gap in
 * the sequence. The order is still correct because only the relative values
 * matter, and {@link listBanners} does not renumber for a gap — only for a
 * duplicate.
 *
 * Side effects: one `findByIdAndDelete` on `banners`, then a best-effort
 * Cloudinary delete of the image. The image clean-up is wrapped so a failure
 * only logs; see the comment below for why.
 *
 * @throws AppError 404 `"Banner not found"` when the id is malformed or no
 * such banner exists.
 */
adminSettingsRouter.delete(
  "/settings/banners/:bannerId",
  requirePermission("settings:manage"),
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
