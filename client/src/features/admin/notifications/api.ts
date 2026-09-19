/**
 * Registering this browser for admin push.
 *
 * @packageDocumentation
 */
import { apiPost } from "@/lib/api";

/**
 * Tells the server which FCM token addresses this browser.
 *
 * @remarks
 * `POST /admin/push-token`. Until this succeeds the server cannot notify this
 * device, even though the browser has already granted permission — so the bell
 * showing "on" is not proof that alerts will arrive.
 *
 * Tokens are per browser and per device, and Firebase can rotate them, which is
 * why the push hook re-registers on every visit where permission is already
 * granted rather than storing the token anywhere.
 *
 * @param token - The FCM registration token.
 * @returns `{ registered: true }` on success.
 * @throws The server's first error message.
 */
export async function registerAdminPushToken(token: string) {
  return apiPost<{ registered: boolean }, { token: string }>(
    "/admin/push-token",
    { token },
  );
}
