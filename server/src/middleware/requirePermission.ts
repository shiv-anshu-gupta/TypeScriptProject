/**
 * The gate every admin route stands behind.
 *
 * @remarks
 * One middleware does three things in a fixed order, because splitting them
 * into three would mean a new route could be written with only two:
 *
 * 1. finds the caller's `User` record and reads the role off it;
 * 2. checks the role holds the permission the route asked for;
 * 3. for a staff member, checks the request came from one of the shop's
 *    registered networks.
 *
 * Step 3 is folded in here on purpose. A separate `requireShopNetwork` would be
 * one line for a future maintainer to forget, and forgetting it would be
 * silent - the route would work perfectly, from anywhere in the world.
 *
 * The role is read from the database on every request, not from the session
 * token, which is what makes revocation immediate: an admin removing someone
 * from the staff list takes effect on that person's very next call, with no
 * logout and no waiting for a token to expire.
 *
 * @packageDocumentation
 */
import type { NextFunction, Request, Response } from "express";
import { can, requiresShopNetwork, type Permission } from "../auth/permissions";
import { ShopNetworkModel } from "../models/ShopNetwork";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { sameNetwork } from "../utils/clientIp";
import { recordOffNetworkDenial } from "../services/audit";
import { ipOf, setActor } from "./actor";
import { getDbUserFromReq } from "./auth";

/**
 * The message a staff member sees when they are away from the shop.
 *
 * @remarks
 * Begins with a stable marker the panel matches on, so it can show a helpful
 * screen ("join the shop's Wi-Fi") instead of a generic error. Matching on
 * prose would break the moment the wording is translated.
 */
export const OFF_NETWORK_CODE = "OFF_SHOP_NETWORK";

/**
 * The refusal, naming the address the server actually saw.
 *
 * @remarks
 * The address is in the message on purpose. Without it, "you are not on the
 * shop's network" is unfalsifiable from the outside: the shopkeeper cannot
 * tell a staff member working from home apart from a gate reading the wrong
 * header, which is exactly the confusion this cost once already. It is the
 * caller's own address, so telling them is no disclosure.
 *
 * @param ip - The address as read, or `""` when none could be read.
 * @returns The message, beginning with {@link OFF_NETWORK_CODE} so the panel
 * can match on the marker rather than the prose.
 */
export function offNetworkMessage(ip: string): string {
  const seen = ip ? `We see you on ${ip}.` : "We could not read your address.";
  return `${OFF_NETWORK_CODE}: Staff can open lists only on the shop's own internet connection. ${seen}`;
}

/**
 * How long the shop's registered networks are held in memory.
 *
 * @remarks
 * The list changes perhaps twice a year, and every staff request would
 * otherwise read it. Half a minute is short enough that registering a new
 * network from the shop feels immediate, and long enough that a polling panel
 * does not query it every few seconds. Each serverless instance caches
 * separately, so the real worst case is one stale instance for 30 seconds.
 */
const NETWORK_CACHE_MS = 30_000;

let cachedNetworks: { ips: string[]; readAt: number } | null = null;

/**
 * The shop's registered addresses, from memory when recent enough.
 *
 * @param force - Skip the cache; used right after the list is edited.
 * @returns Every registered address, normalised as stored.
 */
export async function registeredNetworkIps(force = false): Promise<string[]> {
  const fresh =
    !force && cachedNetworks && Date.now() - cachedNetworks.readAt < NETWORK_CACHE_MS;
  if (fresh && cachedNetworks) return cachedNetworks.ips;

  const rows = await ShopNetworkModel.find({}, { ip: 1 }).lean<{ ip: string }[]>();
  cachedNetworks = { ips: rows.map((row) => row.ip), readAt: Date.now() };
  return cachedNetworks.ips;
}

/**
 * Drops the cached network list.
 *
 * @remarks
 * Called by the routes that add or remove a network, so the shopkeeper sees
 * their own change take effect at once rather than up to
 * {@link NETWORK_CACHE_MS} later.
 */
export function forgetNetworkCache(): void {
  cachedNetworks = null;
}

/**
 * Builds the guard for one permission.
 *
 * @param permission - What this route needs the caller to hold.
 * @returns Express middleware that passes only a caller who holds it - and,
 * for staff, only from the shop's network.
 *
 * @throws AppError 401 when there is no signed-in user.
 * @throws AppError 403 `"Admin access only"` when the role lacks the
 * permission. The message is deliberately the same one the old admin-only gate
 * used, so a probe cannot tell "wrong role" from "no such power".
 * @throws AppError 403 {@link OFF_NETWORK_MESSAGE} when a staff member calls
 * from anywhere but the shop.
 *
 * @example
 * ```ts
 * adminGroceryListRouter.patch(
 *   "/grocery-lists/:listId/prices",
 *   requirePermission("lists:price"),
 *   asyncHandler(async (req, res) => { ... }),
 * );
 * ```
 */
export function requirePermission(permission: Permission) {
  return asyncHandler(
    async (req: Request, _res: Response, next: NextFunction) => {
      const dbUser = await getDbUserFromReq(req);
      const role = String(dbUser.role ?? "user");
      const ip = ipOf(req);

      setActor(req, {
        id: String(dbUser._id),
        email: String(dbUser.email ?? ""),
        role,
        ip,
      });

      if (!can(role, permission)) {
        throw new AppError(403, "Admin access only");
      }

      if (requiresShopNetwork(role)) {
        const allowed = await registeredNetworkIps();
        if (!sameNetwork(ip, allowed)) {
          // Recorded before the throw: a staff member working from outside the
          // shop is exactly what the shopkeeper wants to know about.
          void recordOffNetworkDenial(req, ip);
          throw new AppError(403, offNetworkMessage(ip));
        }
        void touchNetwork(ip);
      }

      next();
    },
  );
}

/**
 * Records that the shop's network was used, so a dead entry is easy to spot.
 *
 * @remarks
 * Fire-and-forget, and failure is ignored: this is a convenience for the
 * panel's staff screen, never a reason to reject a request that has already
 * passed every check.
 *
 * @param ip - The address the request arrived from.
 */
async function touchNetwork(ip: string): Promise<void> {
  try {
    await ShopNetworkModel.updateOne({ ip }, { $set: { lastSeenAt: new Date() } });
  } catch {
    // A missing timestamp is not worth failing a sale over.
  }
}
