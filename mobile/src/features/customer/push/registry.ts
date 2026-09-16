import { removePushToken } from "./api";

// The push token this device registered for the signed-in customer.
//
// Kept outside React because sign-out has to hand it back BEFORE the session
// ends (the server needs the customer's token to remove it). Without that, a
// shared phone keeps receiving the previous customer's order alerts, and the
// next customer is never registered.
let registered: string | null = null;

export function rememberPushToken(token: string | null) {
  registered = token;
}

export function registeredPushToken() {
  return registered;
}

// Best effort: called just before signing out. A failure here must never stop
// the customer from signing out.
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
