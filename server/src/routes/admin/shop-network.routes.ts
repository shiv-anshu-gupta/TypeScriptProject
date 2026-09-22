/**
 * The internet connections that count as "inside the shop".
 *
 * @remarks
 * All four routes are behind `network:manage`, which only an admin holds - a
 * staff member cannot see the list they are being measured against, let alone
 * add their own home broadband to it.
 *
 * The shopkeeper does not type an address. They stand in the shop, open the
 * panel, and save whatever the server reports seeing. A small shop's broadband
 * gets a new public address on every reconnect, so an address written into an
 * environment variable would lock the staff out after the first power cut and
 * need a redeploy to put right.
 *
 * `GET /admin/shop-network/whoami` exists so that this can be checked rather
 * than assumed: open it from the shop's Wi-Fi and from mobile data, and the
 * two addresses should differ. If they do not, the gate is not protecting
 * anything and the network is doing something unusual - carrier-grade NAT
 * placing both connections behind one address, say.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { actorOf, ipOf } from "../../middleware/actor";
import {
  forgetNetworkCache,
  registeredNetworkIps,
  requirePermission,
} from "../../middleware/requirePermission";
import { ShopNetworkModel } from "../../models/ShopNetwork";
import { recordAudit } from "../../services/audit";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";
import { sameNetwork } from "../../utils/clientIp";
import { ok } from "../../utils/envelope";

export const adminShopNetworkRouter = Router();

/**
 * How many connections a shop may register.
 *
 * @remarks
 * Enough for the broadband and a phone hotspot as a standby. A longer list
 * would quietly become a list of everywhere the staff have ever worked from,
 * which is the opposite of the point.
 */
const MAX_NETWORKS = 3;

/**
 * `GET /admin/shop-network/whoami` — the address this request came from.
 *
 * @remarks
 * Auth: `network:manage` (admin only). No parameters.
 *
 * The one route here that reads nothing from the database except the
 * registered list, so the shopkeeper can see both halves of the question at
 * once: where am I, and is that registered?
 *
 * Side effects: none.
 *
 * @returns `{ ip, registered }` - the address as `utils/clientIp.ts` read it,
 * and whether a staff member on this connection would be let in. `ip` is `""`
 * when no address could be read at all, in which case the gate refuses
 * everyone.
 */
adminShopNetworkRouter.get(
  "/shop-network/whoami",
  requirePermission("network:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const ip = ipOf(req);
    const registered = await registeredNetworkIps(true);
    res.json(ok({ ip, registered: sameNetwork(ip, registered) }));
  }),
);

/**
 * `GET /admin/shop-network` — every registered connection.
 *
 * @remarks
 * Auth: `network:manage` (admin only). No parameters.
 *
 * `lastSeenAt` is what makes a stale row obvious: a connection nobody has used
 * for months is one the ISP has almost certainly reassigned.
 *
 * Side effects: none.
 *
 * @returns `{ items: [{ _id, ip, label, registeredByEmail, lastSeenAt,
 * createdAt }], currentIp }`.
 */
adminShopNetworkRouter.get(
  "/shop-network",
  requirePermission("network:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const items = await ShopNetworkModel.find().sort({ createdAt: 1 }).lean();
    res.json(ok({ items, currentIp: ipOf(req) }));
  }),
);

/**
 * `POST /admin/shop-network` — register the connection this request came from.
 *
 * @remarks
 * Auth: `network:manage` (admin only).
 *
 * Body: `{ label? }`. The address is **not** taken from the body; it is read
 * from the request, so a shopkeeper cannot register somewhere they are not.
 * That is the whole design: to add the shop's Wi-Fi you must be on the shop's
 * Wi-Fi.
 *
 * Registering an address that is already stored just updates its label.
 *
 * Side effects: one upsert, the cached list is dropped so the change takes
 * effect at once, and one audit row.
 *
 * @throws AppError 400 when no address could be read from the request.
 * @throws AppError 400 when {@link MAX_NETWORKS} are already registered.
 */
adminShopNetworkRouter.post(
  "/shop-network",
  requirePermission("network:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const ip = ipOf(req);
    if (!ip) {
      throw new AppError(
        400,
        "Could not read this connection's address, so it cannot be registered",
      );
    }

    const label = String(req.body?.label ?? "").trim().slice(0, 40);
    const already = await ShopNetworkModel.findOne({ ip });

    if (!already) {
      const count = await ShopNetworkModel.countDocuments();
      if (count >= MAX_NETWORKS) {
        throw new AppError(
          400,
          `Only ${MAX_NETWORKS} connections can be registered. Remove one first.`,
        );
      }
    }

    await ShopNetworkModel.updateOne(
      { ip },
      {
        $set: { label },
        $setOnInsert: { registeredByEmail: actorOf(req)?.email ?? "" },
      },
      { upsert: true },
    );
    forgetNetworkCache();

    void recordAudit(req, "network.registered", { detail: `${ip} ${label}`.trim() });

    res.json(ok({ ip, label, added: !already }));
  }),
);

/**
 * `DELETE /admin/shop-network/:id` — stop trusting one connection.
 *
 * @remarks
 * Auth: `network:manage` (admin only).
 *
 * Path: the row's `_id`.
 *
 * Removing the last registered connection locks every staff member out, which
 * is the correct failure direction and is left possible on purpose: it is the
 * fastest way to suspend all staff access at once.
 *
 * Side effects: one delete, the cached list is dropped, one audit row.
 *
 * @throws AppError 404 when no such row exists.
 */
adminShopNetworkRouter.delete(
  "/shop-network/:id",
  requirePermission("network:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const removed = await ShopNetworkModel.findByIdAndDelete(req.params.id);
    if (!removed) throw new AppError(404, "That connection is not registered");
    forgetNetworkCache();

    void recordAudit(req, "network.removed", { detail: removed.ip });

    const left = await ShopNetworkModel.countDocuments();
    res.json(ok({ removed: removed.ip, remaining: left }));
  }),
);
