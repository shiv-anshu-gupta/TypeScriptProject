/**
 * Remembering which push token this device handed over, outside React.
 *
 * @packageDocumentation
 */

import { removePushToken } from "./api";

/**
 * The push token this device registered for the signed-in customer.
 *
 * @remarks
 * Kept outside React because sign-out has to hand it back BEFORE the session
 * ends (the server needs the customer's token to remove it). Without that, a
 * shared phone keeps receiving the previous customer's order alerts, and the
 * next customer is never registered.
 *
 * A module variable, not a ref: sign-out runs from a screen that is about to
 * unmount, and a ref would be gone before the request could be made.
 */
let registered: string | null = null;

/**
 * Records that this device is registered under `token`.
 *
 * @remarks
 * Call it only **after** the server has accepted the token. Recording one
 * that never arrived would make the registration effect skip itself for the
 * rest of the session.
 */
export function rememberPushToken(token: string | null) {
  registered = token;
}

/**
 * The token this device is registered under, or `null`.
 *
 * @remarks
 * Used as the "already done" check by the registration effect, so a
 * re-render does not ask the operating system for a token again.
 */
export function registeredPushToken() {
  return registered;
}

/**
 * Hands the device's token back to the server and forgets it.
 *
 * @remarks
 * Best effort: called just before signing out. A failure here must never stop
 * the customer from signing out.
 *
 * It must be awaited before `signOut()`, because the server needs the
 * customer's own token to authorise the removal.
 *
 * The local record is cleared first, so the next customer on this phone
 * registers their own token even if the network call fails.
 *
 * Never throws, and does nothing when there is no token.
 */
export async function releasePushToken() {
  const token = registered;
  registered = null;
  if (!token) return;
  try {
    await removePushToken(token);
  } catch (error) {
    console.warn("[push] could not hand back the device token", error);
  }
}
