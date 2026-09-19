/**
 * Web push to the admin's browser, through Firebase Cloud Messaging.
 *
 * @remarks
 * This is how the shop learns of a new order while the admin panel is open in
 * a browser tab. The customer's phone is notified separately, through Expo -
 * see utils/push.ts.
 *
 * Nothing here throws: a notification is a side-effect of the customer's
 * request and must never fail it.
 *
 * @packageDocumentation
 */
import {
  cert,
  getApp as getAdminApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { User } from "../models/User";

// Firebase Admin is initialised lazily from env so the server still boots when
// web-push isn't configured yet (e.g. local dev). Set these in the server env:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// (the private key is stored with literal "\n" which we convert to newlines.)
let cachedApp: App | null | undefined;

/**
 * The Firebase Admin app, initialised on first use and then cached.
 *
 * @returns The app, or `null` when the three env vars are not all set - in
 * which case every notification in this file quietly does nothing. The result
 * is cached either way, so an unconfigured server does not re-check on every
 * order.
 */
function getApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    cachedApp = null; // not configured — notifications simply no-op
    return null;
  }

  cachedApp = getApps().length
    ? getAdminApp()
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
  return cachedApp;
}

/**
 * Send an FCM web push to a set of tokens. Returns the tokens that are dead
 * (unregistered/invalid) so the caller can prune them. Never throws.
 *
 * @remarks
 * Sent as one multicast, with a fixed icon and a click target of
 * `/admin/grocery-lists`, so the shopkeeper lands on the orders screen.
 * Empty and duplicate tokens are dropped first.
 *
 * "Dead" means FCM reported the token as unregistered or invalid, which is
 * permanent - a token that merely failed this once is not reported, so a
 * transient outage never costs the admin their notifications.
 *
 * @param data - arbitrary string pairs delivered to the service worker.
 * @returns The subset of tokens that should be removed from the database.
 * Empty when nothing failed permanently, when Firebase is not configured, or
 * when the send itself threw.
 */
async function sendWebPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<string[]> {
  const app = getApp();
  const unique = Array.from(new Set(tokens.filter(Boolean)));
  if (!app || !unique.length) return [];

  try {
    const res = await getMessaging(app).sendEachForMulticast({
      tokens: unique,
      notification: { title, body },
      data,
      webpush: {
        notification: { icon: "/icon-192.png" },
        fcmOptions: { link: "/admin/grocery-lists" },
      },
    });

    const dead: string[] = [];
    res.responses.forEach((r, i) => {
      const code = r.error?.code ?? "";
      if (
        !r.success &&
        (code.includes("registration-token-not-registered") ||
          code.includes("invalid-argument") ||
          code.includes("invalid-registration-token"))
      ) {
        dead.push(unique[i]);
      }
    });
    return dead;
  } catch {
    return [];
  }
}

/**
 * Notify every admin's browser of something (e.g. a new order). Fire-and-forget,
 * never throws — a push failure must not break the customer's request.
 *
 * @remarks
 * Collects `webPushTokens` from every user with role `admin`, sends to all of
 * them, and then writes back: any token FCM called permanently dead is
 * `$pull`ed from every admin record, so the list cannot grow stale as the
 * shop's browsers come and go.
 *
 * Silent when there are no admins, no tokens, or no Firebase configuration.
 *
 * @param data - string pairs passed through to the browser's service worker.
 */
export async function notifyAdmins(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    const admins = await User.find(
      { role: "admin", webPushTokens: { $exists: true, $ne: [] } },
      "webPushTokens",
    );

    const tokens = admins.flatMap(
      (a: { webPushTokens?: string[] }) => a.webPushTokens ?? [],
    );
    if (!tokens.length) return;

    const dead = await sendWebPush(tokens, title, body, data);
    if (dead.length) {
      await User.updateMany(
        { role: "admin" },
        { $pull: { webPushTokens: { $in: dead } } },
      );
    }
  } catch {
    // swallow — notifications are best-effort
  }
}
