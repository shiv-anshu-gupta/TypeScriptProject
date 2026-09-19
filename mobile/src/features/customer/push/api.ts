/**
 * Registering and un-registering this device for order alerts.
 *
 * @remarks
 * Both need a bearer token, and both pair the token with the *signed-in
 * customer* — which is why removal has to happen before the session ends, not
 * after.
 *
 * @packageDocumentation
 */

import { apiDelete, apiPost } from "@/lib/api";

/**
 * `POST /customer/push-token` — sends this device's Expo token to the server.
 *
 * @remarks
 * Safe to repeat: the server stores one token per device per customer.
 *
 * @returns `{ registered }`.
 * @throws Error When signed out, or the request fails. The caller logs it and
 * carries on — a customer can do nothing about a failure here.
 */
export async function savePushToken(token: string) {
  return apiPost<{ registered: boolean }, { token: string }>(
    "/customer/push-token",
    { token },
  );
}

/**
 * `DELETE /customer/push-token` — stops this device getting the signed-in
 * customer's alerts.
 *
 * @remarks
 * The token goes in the request **body**, not the URL, which is why it is
 * passed through the axios config's `data`.
 *
 * Must be called while the session is still alive. Afterwards there is no
 * token to authorise it with and the device keeps receiving the previous
 * customer's alerts.
 *
 * @returns `{ registered }`.
 * @throws Error When the request fails; sign-out must proceed anyway.
 */
export async function removePushToken(token: string) {
  return apiDelete<{ registered: boolean }>("/customer/push-token", {
    data: { token },
  });
}
