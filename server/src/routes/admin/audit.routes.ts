/**
 * Reading the shop's audit trail.
 *
 * @remarks
 * One route, and it only reads. There is deliberately **no** route in this
 * file - or anywhere else - that edits or deletes an audit row: a log the
 * people being logged can tidy up is not a log. Rows leave only by expiring,
 * a year after they were written, through the TTL index on the model.
 *
 * Behind `audit:read`, which only an admin holds.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { requirePermission } from "../../middleware/requirePermission";
import { AuditEventModel } from "../../models/AuditEvent";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";

export const adminAuditRouter = Router();

/** Rows per page when the caller does not say. */
const DEFAULT_LIMIT = 100;
/** The most any one request will return, so a year of history cannot be asked for at once. */
const MAX_LIMIT = 200;

/**
 * `GET /admin/audit` — what was done behind the counter, newest first.
 *
 * @remarks
 * Auth: `audit:read` (admin only).
 *
 * Query: `limit` (1-{@link MAX_LIMIT}, default {@link DEFAULT_LIMIT}), `actor`
 * to filter to one person's email, and `before` - an ISO timestamp - to page
 * backwards. Paging by timestamp rather than by page number means a row
 * written while the shopkeeper reads cannot shuffle the page under them.
 *
 * Unlike almost every other admin list route in this codebase, this one **is**
 * bounded. The log is the one collection here that grows with every action
 * rather than with every order.
 *
 * Side effects: none.
 *
 * @returns `{ items, nextBefore }`. `nextBefore` is the timestamp to pass back
 * for the following page, or `null` at the end.
 */
adminAuditRouter.get(
  "/audit",
  requirePermission("audit:read"),
  asyncHandler(async (req: Request, res: Response) => {
    const asked = Number(req.query.limit);
    const limit = Number.isFinite(asked)
      ? Math.min(Math.max(Math.trunc(asked), 1), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const filter: Record<string, unknown> = {};

    const actor = String(req.query.actor ?? "").trim().toLowerCase();
    if (actor) filter.actorEmail = actor;

    const before = new Date(String(req.query.before ?? ""));
    if (!Number.isNaN(before.valueOf())) filter.createdAt = { $lt: before };

    const rows = await AuditEventModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const items = rows.map((row) => ({
      _id: String(row._id),
      action: row.action,
      actorEmail: row.actorEmail,
      actorRole: row.actorRole,
      listId: row.groceryList ? String(row.groceryList) : null,
      ip: row.ip,
      detail: row.detail,
      createdAt: row.createdAt,
    }));

    res.json(
      ok({
        items,
        nextBefore:
          items.length === limit ? items[items.length - 1].createdAt : null,
      }),
    );
  }),
);
