/**
 * Firebase Cloud Messaging setup for browser push to the shopkeeper.
 *
 * @remarks
 * Covers the case the in-page alert cannot: the admin tab is closed or in the
 * background when a customer sends a list. Foreground messages become toasts;
 * background ones are handled by `public/firebase-messaging-sw.js` and become
 * OS notifications that focus or open `/admin/grocery-lists`.
 *
 * Note the asymmetry with the mobile side: admin push is FCM, while push to
 * **customers** goes through Expo from the server. They share no code.
 *
 * Everything here fails silently by design. If any of the six `VITE_FIREBASE_*`
 * variables is missing, {@link isPushConfigured} is false, the bell in the
 * admin header renders nothing at all, and there is no message anywhere saying
 * push is unconfigured. `client/.env` defines only the backend URL and the
 * Clerk key, so browser push does not work in local development unless you add
 * the Firebase names yourself.
 *
 * Being `VITE_` values, they are baked into the bundle at build time — changing
 * them in Vercel requires a redeploy.
 *
 * @packageDocumentation
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

// Public Firebase web config — safe to expose (it's in the client bundle).
// Set these in the client env (Vercel): VITE_FIREBASE_*.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// The Web Push "public key" from Firebase → Cloud Messaging → Web configuration.
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

/**
 * Whether all the Firebase values needed for push are present in this build.
 *
 * @remarks
 * Checks five of the six: `authDomain` is not tested, so a build missing only
 * that value reports as configured and then fails later.
 *
 * A false result is the reason the notification bell disappears from the admin
 * header. Nothing is logged and nothing is shown, so an absent bell in
 * production means a missing environment variable and a redeploy, not a bug in
 * the component.
 *
 * @returns `true` when push can be attempted.
 */
export function isPushConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      VAPID_KEY,
  );
}

/**
 * Reports the browser's current notification permission.
 *
 * @remarks
 * Adds an `"unsupported"` value for browsers with no Notification API at all,
 * so the bell can distinguish "cannot ask" from "asked and refused". A
 * `"denied"` result cannot be recovered from in code: the shopkeeper has to
 * change it in browser settings.
 *
 * This is read synchronously, so it does not reflect a permission the user
 * changes while the page is open until something re-reads it.
 *
 * @returns `"default"`, `"granted"`, `"denied"`, or `"unsupported"`.
 */
export function pushPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

/** Cached Messaging instance, created at most once per page. */
let messaging: Messaging | null = null;

/**
 * Lazily creates the Firebase Messaging instance.
 *
 * @remarks
 * Returns `null` rather than throwing when push is unconfigured or the browser
 * does not support FCM — iOS Safari outside an installed PWA being the common
 * case. Callers must handle `null`.
 *
 * Reuses an existing Firebase app when one has already been initialised, so
 * calling this repeatedly is cheap and safe.
 *
 * @returns The Messaging instance, or `null` if push cannot run here.
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (!isPushConfigured()) return null;
  if (!(await isSupported())) return null; // e.g. iOS Safari (non-PWA)
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  if (!messaging) messaging = getMessaging(app);
  return messaging;
}

// Registers the service worker (passing the public config via query string so
// the worker needn't duplicate it), asks permission, and returns the FCM token.
// Returns null if unsupported or the user declines.
/**
 * Registers the service worker, asks for permission, and returns an FCM token.
 *
 * @remarks
 * The whole opt-in sequence in one call. The caller then `POST`s the token to
 * `/admin/push-token` so the server can address this browser.
 *
 * The public Firebase config is passed to the worker in the registration query
 * string, so `public/firebase-messaging-sw.js` does not have to hard-code a
 * second copy of it. Changing a Firebase value therefore updates both halves
 * from one place.
 *
 * Returns `null` — never throws — when push is unconfigured, the browser
 * cannot do FCM, there is no service worker support, the user declines the
 * permission prompt, or token retrieval fails. The caller cannot distinguish
 * these cases.
 *
 * Note that this shows the browser's permission prompt, so it must be called
 * from a user gesture. Calling it on page load produces a prompt the
 * shopkeeper did not ask for, and a denial cannot be undone from code.
 *
 * @returns The FCM registration token, or `null`.
 */
export async function requestAdminPushToken(): Promise<string | null> {
  const m = await getMessagingInstance();
  if (!m || !("serviceWorker" in navigator)) return null;

  const swUrl =
    "/firebase-messaging-sw.js?" +
    new URLSearchParams({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    }).toString();

  const registration = await navigator.serviceWorker.register(swUrl);

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  try {
    const token = await getToken(m, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
}

// Foreground messages (tab focused) — the SW only fires when backgrounded.
/**
 * Subscribes to push messages that arrive while the tab is focused.
 *
 * @remarks
 * The service worker handles messages only when the tab is backgrounded, so
 * without this a push that lands while the shopkeeper is looking at the panel
 * would be lost entirely. The caller turns these into toasts.
 *
 * Because the setup is asynchronous, the unsubscribe function arrives in a
 * promise. An effect must await it and call it on cleanup, or the subscription
 * outlives the component.
 *
 * When push is unconfigured or unsupported this resolves to a no-op function,
 * so the caller needs no special case.
 *
 * @param cb - Called with each foreground message payload.
 * @returns A function that cancels the subscription.
 */
export async function onForegroundMessage(
  cb: (payload: MessagePayload) => void,
): Promise<() => void> {
  const m = await getMessagingInstance();
  if (!m) return () => {};
  return onMessage(m, cb);
}
