/**
 * The shopkeeper's staff roster.
 *
 * @remarks
 * Three routes, all behind `staff:manage`, which only an admin holds. A staff
 * member cannot see this list, let alone add to it.
 *
 * Granting access does not create an account. The row here is an invitation
 * keyed by email; the person still signs in through Clerk like anyone else,
 * and `services/user-sync.ts` turns the match into the `staff` role on their
 * `User` document. That is why a row can exist for someone who has never
 * opened the app - the panel shows them as "not signed in yet".
 *
 * Removal does two things in one request: the row goes, and any `User`
 * already holding `staff` for that address drops back to `user`. The second
 * half is what makes it immediate - the permission gate re-reads the role from
 * the database on every request, so the person is out on their next call
 * rather than at their next login.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { actorOf } from "../../middleware/actor";
import { requirePermission } from "../../middleware/requirePermission";
import { StaffAccessModel } from "../../models/StaffAccess";
import { User } from "../../models/User";
import { recordAudit } from "../../services/audit";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";

export const adminStaffRouter = Router();

/** Deliberately loose: Clerk is the authority on whether an address is real. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalises and checks an email from the request body.
 *
 * @param raw - Whatever the panel sent.
 * @returns The lowercased, trimmed address.
 * @throws AppError 400 when it is missing or not shaped like an address.
 */
function readEmail(raw: unknown): string {
  const email = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!email) throw new AppError(400, "Email is required");
  if (!EMAIL_SHAPE.test(email)) throw new AppError(400, "That is not an email address");
  return email;
}

/**
 * `GET /admin/staff` — the roster, newest grant first.
 *
 * @remarks
 * Auth: `staff:manage` (admin only). No parameters.
 *
 * Each row joins the invitation to the `User` record, when one exists, so the
 * panel can distinguish three states: invited but never signed in, signed in
 * and holding `staff`, and signed in but **not** holding `staff` - which can
 * only happen if the address is also in `ADMIN_EMAILS`, since an admin is
 * never demoted.
 *
 * Side effects: none.
 *
 * @returns `{ items: [{ email, name, addedByEmail, createdAt, signedIn,
 * role }] }`.
 */
adminStaffRouter.get(
  "/staff",
  requirePermission("staff:manage"),
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await StaffAccessModel.find().sort({ createdAt: -1 }).lean();
    const emails = rows.map((row) => row.email);

    const accounts = await User.find(
      { email: { $in: emails } },
      { email: 1, role: 1, name: 1 },
    ).lean<{ email?: string; role?: string; name?: string }[]>();
    const byEmail = new Map(
      accounts.map((account) => [String(account.email ?? ""), account]),
    );

    const items = rows.map((row) => {
      const account = byEmail.get(row.email);
      return {
        email: row.email,
        name: row.name || account?.name || "",
        addedByEmail: row.addedByEmail,
        createdAt: row.createdAt,
        signedIn: Boolean(account),
        role: account?.role ?? null,
      };
    });

    res.json(ok({ items }));
  }),
);

/**
 * `POST /admin/staff` — grant staff access to an email address.
 *
 * @remarks
 * Auth: `staff:manage` (admin only).
 *
 * Body: `{ email, name? }`. `name` is the shopkeeper's own label for the
 * person and is not read from their account.
 *
 * Adding an address that is already on the roster updates the label rather
 * than failing, so the panel's form is safe to submit twice.
 *
 * If that person already has an account, the role is applied here and now;
 * otherwise it waits for their first sign-in. An address in `ADMIN_EMAILS` is
 * refused: an admin cannot be demoted into staff, and pretending otherwise
 * would leave the panel showing a role the sync will not honour.
 *
 * Side effects: one upsert, and one `User` update when the person exists. One
 * audit row.
 *
 * @throws AppError 400 when the email is missing or malformed.
 * @throws AppError 400 when the address belongs to a shopkeeper.
 */
adminStaffRouter.post(
  "/staff",
  requirePermission("staff:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const email = readEmail(req.body?.email);
    const name = String(req.body?.name ?? "").trim().slice(0, 60);

    const existing = await User.findOne({ email }, { role: 1 }).lean<{
      role?: string;
    } | null>();
    if (existing?.role === "admin") {
      throw new AppError(400, "That address is a shop owner already");
    }

    await StaffAccessModel.updateOne(
      { email },
      {
        $set: { name },
        $setOnInsert: { addedByEmail: actorOf(req)?.email ?? "" },
      },
      { upsert: true },
    );

    // Applies at once for someone who already has an account; for anyone else
    // services/user-sync.ts grants it at their first sign-in.
    const applied = await User.updateOne(
      { email, role: { $ne: "admin" } },
      { $set: { role: "staff" } },
    );

    void recordAudit(req, "staff.added", { detail: email });

    res.json(
      ok({
        email,
        appliedNow: applied.modifiedCount > 0,
      }),
    );
  }),
);

/**
 * `DELETE /admin/staff/:email` — take staff access away.
 *
 * @remarks
 * Auth: `staff:manage` (admin only).
 *
 * Path: the address, URL-encoded.
 *
 * Both halves always run, even when the roster row is already gone, so a
 * half-finished earlier removal cannot leave someone holding the role. An
 * admin's record is never touched.
 *
 * Takes effect on that person's **next request**: the permission gate reads
 * the role from the database every time, so there is no session to wait out.
 *
 * Side effects: one delete, one `User` update, one audit row.
 *
 * @throws AppError 400 when the address is missing or malformed.
 */
adminStaffRouter.delete(
  "/staff/:email",
  requirePermission("staff:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const email = readEmail(req.params.email);

    await StaffAccessModel.deleteOne({ email });
    const demoted = await User.updateOne(
      { email, role: "staff" },
      { $set: { role: "user" } },
    );

    void recordAudit(req, "staff.removed", { detail: email });

    res.json(ok({ email, demoted: demoted.modifiedCount > 0 }));
  }),
);
