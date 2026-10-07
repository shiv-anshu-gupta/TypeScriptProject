/**
 * A notification from the shop to every customer's phone - an offer, a new
 * arrival, "we are open on Diwali".
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, giving `/admin/broadcasts`
 * (`GET`, `POST`), `/admin/broadcasts/test` (`POST`) and
 * `/admin/broadcasts/image` (`POST`, the optional banner picture).
 *
 * Every route here asks for `broadcast:send`, which only an admin holds.
 *
 * Two brakes, both enforced here and never trusted to the panel:
 *
 * - **One to everyone per Indian calendar day**, across all admins. The
 *   `Broadcast` record is written *before* the send, and a unique index on its
 *   `dayKey` refuses the second one, so two clicks - or two admins - racing
 *   each other cannot both reach the customers.
 * - **Twenty test sends per admin per day**, through the shared rate counter.
 *   A test goes only to the sender's own phone, so this is a guard against a
 *   stuck button rather than against annoying customers.
 *
 * Every notification carries `{ type: "broadcast", target, targetId? }` as its
 * push data, which the app reads to open the right screen when tapped, and is
 * sent on the Android `"offers"` channel so a customer can mute offers without
 * muting their order updates.
 *
 * A notification may carry a banner picture. It must first be uploaded through
 * `/admin/broadcasts/image`, which answers with a 1024x512 delivery URL on the
 * shop's own Cloudinary; the sends accept such a URL and nothing else, so no
 * arbitrary link can ever be pushed to customers' phones. A send with a
 * picture adds `imageStyle: "banner"` to the push data, which app version
 * 1.0.5 and newer reads to draw it full width; older versions show the same
 * picture as the small image beside the text.
 *
 * @packageDocumentation
 */
import { Router, type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { getDbUserFromReq } from "../../middleware/auth";
import { requirePermission } from "../../middleware/requirePermission";
import { actorOf } from "../../middleware/actor";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { AppError } from "../../utils/AppError";
import { sendPushNotifications, checkPushReceipts, type PushOptions } from "../../utils/push";
import {
  ownCloudinaryImageUrl,
  pushBannerImage,
  uploadSingleBufferToCloudinary,
} from "../../utils/cloudinary";
import { consume } from "../../services/rateLimit";
import { recordAudit } from "../../services/audit";
import {
  BROADCAST_TARGET_TYPES,
  BroadcastModel,
  type BroadcastKind,
  type BroadcastTarget,
  type BroadcastTargetType,
} from "../../models/Broadcast";
import { Category } from "../../models/Category";
import { Product } from "../../models/Product";
import { User } from "../../models/User";

/** The ceilings the panel shows beside its inputs, and this file enforces. */
export const BROADCAST_LIMITS = { titleMax: 50, bodyMax: 180, perDay: 1 } as const;

/**
 * Broadcasts go out on the app's default channel, which every installed copy
 * has. A channel the phone does not have yet (an "offers" channel created by
 * a newer update) makes Android drop the notification silently, and a
 * broadcast is exactly the thing that reaches people who have not opened the
 * app in a while.
 */
const BROADCAST_PUSH_OPTIONS: PushOptions = {};

/** Where banner pictures are stored in Cloudinary. */
const BROADCAST_IMAGE_FOLDER = "ecommerce-monster-video/broadcasts";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const IMAGE_TYPE_MESSAGE = "The picture must be a JPG, PNG or WebP image.";
export const IMAGE_SIZE_MESSAGE = "The picture must be under 5 MB.";
export const IMAGE_MISSING_MESSAGE = "Choose a picture to upload.";
export const IMAGE_NOT_OURS_MESSAGE = "Upload the picture here first.";

/** How many past sends the panel's history shows. */
const HISTORY_SIZE = 20;

/** India Standard Time is UTC+5:30, all year - India has no daylight saving. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/**
 * Matches what the app stores as an Expo push token. Kept in step with
 * `isExpoPushToken` in utils/push.ts, which is the check that actually gates
 * the send; this one only lets the database count and fetch candidates.
 */
const EXPO_TOKEN_PATTERN = /^Expo(nent)?PushToken\[/;

/**
 * Everyone who could receive a broadcast: any account with a phone - customers,
 * staff and admins alike, so the shop sees exactly what its customers see.
 */
const AUDIENCE_FILTER = { pushTokens: EXPO_TOKEN_PATTERN };

export const DAILY_LIMIT_MESSAGE =
  "One notification to everyone per day. The next one can go tomorrow.";
export const NO_DEVICE_MESSAGE =
  "Your account has no phone registered for notifications. Sign in to the sKirana app on your phone with this account first.";

/**
 * The Indian calendar day a moment falls on.
 *
 * @param now - Milliseconds since the epoch.
 * @returns `"YYYY-MM-DD"` as a clock in India would show it. 18:29 UTC is
 * still today there; 18:30 UTC is already tomorrow.
 */
export function istDayKey(now: number = Date.now()): string {
  return new Date(now + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * The moment the next Indian calendar day begins.
 *
 * @param now - Milliseconds since the epoch.
 * @returns Midnight in India after `now`, as a UTC instant (18:30 UTC).
 */
export function nextIstMidnight(now: number = Date.now()): Date {
  const shifted = new Date(now + IST_OFFSET_MS);
  const nextMidnightShifted = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + 1,
  );
  return new Date(nextMidnightShifted - IST_OFFSET_MS);
}

/**
 * Cleans one line of text the admin typed.
 *
 * @remarks
 * Control characters - newlines, tabs, the invisible ones a paste can carry -
 * become spaces, runs of whitespace collapse to one, and the ends are
 * trimmed. A notification is one or two lines on a lock screen; a stray
 * newline would only waste one of them.
 */
export function cleanText(value: unknown): string {
  return String(value ?? "")
    // C0 and C1 controls, and the Unicode line and paragraph separators.
    .replace(/[\p{Cc}\p{Zl}\p{Zp}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A validated request body, ready to send. */
export type BroadcastPayload = {
  title: string;
  body: string;
  target: BroadcastTarget;
  /** The banner picture, already checked to be on our Cloudinary. */
  imageUrl?: string;
};

/**
 * Checks the optional banner picture of a send request.
 *
 * @returns `undefined` when none was given (absent, `null` or empty), else the
 * normalised URL.
 * @throws AppError 400 {@link IMAGE_NOT_OURS_MESSAGE} for anything that is not
 * an image on the shop's own Cloudinary account.
 */
export function parseImageUrl(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const url = ownCloudinaryImageUrl(value);
  if (!url) throw new AppError(400, IMAGE_NOT_OURS_MESSAGE);
  return url;
}

/**
 * Validates the shape of a send request, without touching the database.
 *
 * @throws AppError 400 naming what is wrong.
 */
export function parseBroadcastShape(raw: unknown): BroadcastPayload {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const title = cleanText(input.title);
  const body = cleanText(input.body);

  if (!title) throw new AppError(400, "Write a title for the notification.");
  if (title.length > BROADCAST_LIMITS.titleMax) {
    throw new AppError(400, `The title can be at most ${BROADCAST_LIMITS.titleMax} characters.`);
  }
  if (!body) throw new AppError(400, "Write the message for the notification.");
  if (body.length > BROADCAST_LIMITS.bodyMax) {
    throw new AppError(400, `The message can be at most ${BROADCAST_LIMITS.bodyMax} characters.`);
  }

  const rawTarget = (
    input.target && typeof input.target === "object" ? input.target : {}
  ) as Record<string, unknown>;
  const type = String(rawTarget.type ?? "") as BroadcastTargetType;
  if (!BROADCAST_TARGET_TYPES.includes(type)) {
    throw new AppError(400, "Choose where the notification opens in the app.");
  }

  const imageUrl = parseImageUrl(input.imageUrl);
  const image = imageUrl ? { imageUrl } : {};

  if (type === "category" || type === "product") {
    const targetId = String(rawTarget.targetId ?? "").trim();
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      throw new AppError(
        400,
        type === "category" ? "Choose a category to open." : "Choose a product to open.",
      );
    }
    return { title, body, target: { type, targetId }, ...image };
  }

  return { title, body, target: { type } as BroadcastTarget, ...image };
}

/**
 * Validates a send request in full, including that its target exists.
 *
 * @throws AppError 400 when the shape is wrong, the category does not exist,
 * or the product does not exist or is not on sale.
 */
export async function parseBroadcastPayload(raw: unknown): Promise<BroadcastPayload> {
  const payload = parseBroadcastShape(raw);
  const { target } = payload;

  if (target.type === "category") {
    const found = await Category.exists({ _id: target.targetId });
    if (!found) throw new AppError(400, "That category no longer exists. Choose another.");
  }
  if (target.type === "product") {
    const found = await Product.exists({ _id: target.targetId, status: "active" });
    if (!found) {
      throw new AppError(
        400,
        "That product is not on sale (it is hidden or deleted). Choose an active product.",
      );
    }
  }

  return payload;
}

/**
 * The push `data` the app reads to route a tap - and, with a banner picture,
 * `imageStyle: "banner"`, which tells app 1.0.5+ to draw it full width.
 */
export function broadcastPushData(
  target: BroadcastTarget,
  imageUrl?: string,
): Record<string, unknown> {
  return {
    type: "broadcast",
    target: target.type,
    ...("targetId" in target ? { targetId: target.targetId } : {}),
    ...(imageUrl ? { imageStyle: "banner" } : {}),
  };
}

/** The push options: the banner picture in place of the logo, when there is one. */
export function broadcastPushOptions(imageUrl?: string): PushOptions {
  return imageUrl ? { ...BROADCAST_PUSH_OPTIONS, image: imageUrl } : BROADCAST_PUSH_OPTIONS;
}

/** One picture, in memory, JPEG/PNG/WebP, at most 5 MB, in the field `image`. */
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, done) => {
    if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) done(null, true);
    else done(new AppError(400, IMAGE_TYPE_MESSAGE));
  },
});

/** Parses the `image` field, turning multer's limits into a clear 400. */
function acceptImage(req: Request, res: Response, next: NextFunction) {
  imageUpload.single("image")(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? IMAGE_SIZE_MESSAGE
          : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
            ? "Upload one picture, in the field named image."
            : "Couldn't read the uploaded picture.";
      return next(new AppError(400, message));
    }
    next(err);
  });
}

/** Whether a database error is a unique-index collision. */
function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: number } | null)?.code === 11000;
}

/** The sender's email as resolved by the permission gate, else from the record. */
function senderEmail(req: Request, dbUser: { email?: unknown }): string {
  return actorOf(req)?.email || String(dbUser.email ?? "");
}

type HistoryRow = {
  _id: unknown;
  title: string;
  body: string;
  target: { type: BroadcastTargetType; targetId?: string };
  kind: BroadcastKind;
  imageUrl?: string;
  recipients: number;
  sentByEmail: string;
  createdAt: Date;
};

/** Shapes one history row for the panel. */
function mapHistory(row: HistoryRow) {
  const target =
    row.target?.targetId && (row.target.type === "category" || row.target.type === "product")
      ? { type: row.target.type, targetId: row.target.targetId }
      : { type: row.target?.type };
  return {
    _id: String(row._id),
    title: row.title,
    body: row.body,
    target,
    kind: row.kind,
    imageUrl: row.imageUrl || null,
    recipients: row.recipients ?? 0,
    sentByEmail: row.sentByEmail ?? "",
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export const adminBroadcastRouter = Router();

// No router-wide gate. `router.use(...)` runs for every request that enters the
// router - including paths that belong to a DIFFERENT router mounted on the
// same "/admin" prefix. Each route below states its own permission instead.

/**
 * `GET /admin/broadcasts` - what the panel needs to show the compose screen.
 *
 * @remarks
 * Answers `{ audience, canSendToday, nextAllowedAt, limits, history }`:
 * `audience` is how many customers have a phone that can receive one;
 * `nextAllowedAt` is midnight in India as an ISO string when today's send has
 * been used, else `null`; `history` is the newest 20 sends, tests included.
 */
adminBroadcastRouter.get(
  "/broadcasts",
  requirePermission("broadcast:send"),
  asyncHandler(async (_req: Request, res: Response) => {
    const now = Date.now();
    // Clear out phones that are gone before counting who will be reached.
    await checkPushReceipts();
    const [audience, sentToday, rows] = await Promise.all([
      User.countDocuments(AUDIENCE_FILTER),
      BroadcastModel.exists({ dayKey: istDayKey(now) }),
      BroadcastModel.find({}).sort({ createdAt: -1 }).limit(HISTORY_SIZE).lean<HistoryRow[]>(),
    ]);

    const canSendToday = !sentToday;
    res.json(
      ok({
        audience,
        canSendToday,
        nextAllowedAt: canSendToday ? null : nextIstMidnight(now).toISOString(),
        limits: BROADCAST_LIMITS,
        history: rows.map(mapHistory),
      }),
    );
  }),
);

/**
 * `POST /admin/broadcasts/image` - uploads the banner picture for a
 * notification.
 *
 * @remarks
 * Multipart, one file in the field `image`: JPG, PNG or WebP, at most 5 MB.
 * Stored in Cloudinary under `ecommerce-monster-video/broadcasts`. Answers
 * `{ imageUrl }`: a delivery URL cropped to 1024x512 (2:1, `c_fill`) with
 * automatic format and quality - the shape of Android's big-picture
 * notification. Pass it back as `imageUrl` on a test or a send.
 *
 * Nothing is recorded; a picture chosen but never sent stays in the folder.
 *
 * @throws AppError 400 for a missing picture, a wrong type or over 5 MB.
 */
adminBroadcastRouter.post(
  "/broadcasts/image",
  requirePermission("broadcast:send"),
  acceptImage,
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file?.buffer?.length) throw new AppError(400, IMAGE_MISSING_MESSAGE);

    const uploaded = await uploadSingleBufferToCloudinary(file.buffer, BROADCAST_IMAGE_FOLDER);
    res.json(ok({ imageUrl: pushBannerImage(uploaded.url) }));
  }),
);

/**
 * `POST /admin/broadcasts/test` - sends the notification to the calling
 * admin's own phone only.
 *
 * @remarks
 * Body: `{ title, body, target, imageUrl? }`. Answers `{ recipients }`, the number of the
 * admin's devices it was handed to Expo for.
 *
 * @throws AppError 400 on any validation failure, or {@link NO_DEVICE_MESSAGE}
 * when the admin has no phone registered.
 * @throws AppError 429 after 20 test sends in a day.
 */
adminBroadcastRouter.post(
  "/broadcasts/test",
  requirePermission("broadcast:send"),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = await parseBroadcastPayload(req.body);
    const dbUser = await getDbUserFromReq(req);
    const tokens: string[] = Array.isArray(dbUser.pushTokens) ? [...dbUser.pushTokens] : [];

    if (!tokens.some((token) => EXPO_TOKEN_PATTERN.test(token))) {
      throw new AppError(400, NO_DEVICE_MESSAGE);
    }

    await consume("broadcastTest", String(dbUser._id));

    const recipients = await sendPushNotifications(
      tokens,
      payload.title,
      payload.body,
      broadcastPushData(payload.target, payload.imageUrl),
      broadcastPushOptions(payload.imageUrl),
    );

    await BroadcastModel.create({
      ...payload,
      kind: "test",
      recipients,
      sentBy: dbUser._id,
      sentByEmail: senderEmail(req, dbUser),
    });

    void recordAudit(req, "broadcast.test", { detail: payload.title });
    res.json(ok({ recipients }));
  }),
);

/**
 * `POST /admin/broadcasts` - sends the notification to every customer.
 *
 * @remarks
 * Body: `{ title, body, target, imageUrl? }`. Answers `{ recipients }`, the
 * number of customer devices it was handed to Expo for.
 *
 * The day's slot is claimed first by writing the `Broadcast` record; only then
 * are customers notified. If reading the customer list fails, the claim is
 * released so the shopkeeper can try again the same day - nobody was sent
 * anything.
 *
 * @throws AppError 400 on any validation failure.
 * @throws AppError 429 {@link DAILY_LIMIT_MESSAGE} when today's send - in
 * India - has already gone, from this admin or another.
 */
adminBroadcastRouter.post(
  "/broadcasts",
  requirePermission("broadcast:send"),
  asyncHandler(async (req: Request, res: Response) => {
    const payload = await parseBroadcastPayload(req.body);
    const dbUser = await getDbUserFromReq(req);
    const dayKey = istDayKey();

    // Fast refusal, and the only one if the unique index were ever missing.
    if (await BroadcastModel.exists({ dayKey })) {
      throw new AppError(429, DAILY_LIMIT_MESSAGE);
    }

    // The claim. A concurrent second click fails here on the unique index.
    let record: { _id: unknown };
    try {
      record = await BroadcastModel.create({
        ...payload,
        kind: "all",
        recipients: 0,
        sentBy: dbUser._id,
        sentByEmail: senderEmail(req, dbUser),
        dayKey,
      });
    } catch (error) {
      if (isDuplicateKey(error)) throw new AppError(429, DAILY_LIMIT_MESSAGE);
      throw error;
    }

    let tokens: string[];
    try {
      const customers = await User.find(AUDIENCE_FILTER)
        .select("pushTokens")
        .lean<{ pushTokens?: string[] }[]>();
      tokens = customers.flatMap((customer) => customer.pushTokens ?? []);
    } catch (error) {
      await BroadcastModel.deleteOne({ _id: record._id }).catch(() => undefined);
      throw error;
    }

    const recipients = await sendPushNotifications(
      tokens,
      payload.title,
      payload.body,
      broadcastPushData(payload.target, payload.imageUrl),
      broadcastPushOptions(payload.imageUrl),
    );

    await BroadcastModel.updateOne({ _id: record._id }, { $set: { recipients } }).catch(
      () => undefined,
    );

    void recordAudit(req, "broadcast.sent", { detail: payload.title });
    res.json(ok({ recipients }));
  }),
);
