/**
 * The build-time configuration the app reads, with its defaults.
 *
 * @remarks
 * Only `EXPO_PUBLIC_*` variables reach the bundle, and they are baked in at
 * export time — nothing here can change on a running phone. Values come from
 * the env files in `mobile/`, and Expo reads `.env.local` **before** `.env`
 * even for a production bundle, which is why publishing goes through
 * `npm run ota` and its preflight guard rather than `eas update` directly.
 *
 * @packageDocumentation
 */

/**
 * Backend base URL, Clerk key and the optional shop WhatsApp number.
 *
 * @remarks
 * `backendUrl` falls back to `http://localhost:5000`, which is a development
 * convenience: a release built without `EXPO_PUBLIC_BACKEND_URL` will start
 * and then fail every request rather than refusing to start.
 *
 * `clerkPublishableKey` falls back to `""`, which Clerk rejects at startup.
 * A production bundle must carry a `pk_live_` key; the preflight script
 * checks that before an over-the-air publish.
 */
export const env = {
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:5000",
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
  // Shop WhatsApp number in international form, e.g. "919876543210".
  // Leave unset to hide the Help row on the Account screen.
  shopWhatsapp: process.env.EXPO_PUBLIC_SHOP_WHATSAPP ?? "",
};
