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

export function isPushConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      VAPID_KEY,
  );
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

let messaging: Messaging | null = null;
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
export async function onForegroundMessage(
  cb: (payload: MessagePayload) => void,
): Promise<() => void> {
  const m = await getMessagingInstance();
  if (!m) return () => {};
  return onMessage(m, cb);
}
