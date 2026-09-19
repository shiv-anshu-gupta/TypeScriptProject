/**
 * Push notifications to the customer's phone, through Expo.
 *
 * @remarks
 * Every function here is best-effort and silent on failure: a notification is
 * a side-effect of somebody else's action (usually the shopkeeper moving an
 * order along), so it must never turn their request into an error.
 *
 * Admin browsers are notified separately, through Firebase - see
 * utils/webPush.ts.
 *
 * @packageDocumentation
 */
import { User } from "../models/User";
import { Types } from "mongoose";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

type ExpoPushMessage = {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

/**
 * Whether a stored string still looks like an Expo push token.
 *
 * @remarks
 * Tokens are written by the app and kept on the user record, so a stale or
 * corrupted one can be there. Expo rejects the whole batch if any address is
 * malformed, hence the check before sending rather than after.
 */
function isExpoPushToken(token: string) {
  return (
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
  );
}

/**
 * Sends an Expo push notification to a set of device tokens.
 *
 * Deliberately never throws: a notification is a side-effect of the
 * shopkeeper's action, so a push failure must not fail their request.
 *
 * @remarks
 * Posts one batch to Expo's public push API at
 * `https://exp.host/--/api/v2/push/send`. Tokens that do not look like Expo
 * tokens are dropped and duplicates are collapsed, so passing the same device
 * twice sends one notification; if nothing valid is left the call returns
 * without any network traffic.
 *
 * Expo's own per-ticket results are not inspected, so a token the service has
 * since retired is not pruned here. Only a thrown network error is logged.
 *
 * @param data - travels with the notification and reaches the app when the
 * customer taps it, so it is what routes the tap to the right screen.
 */
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const validTokens = Array.from(new Set(tokens.filter(isExpoPushToken)));

  if (!validTokens.length) return;

  const messages: ExpoPushMessage[] = validTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data,
  }));

  try {
    await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.error("Failed to send push notification", error);
  }
}

/**
 * Look up a user's devices and push to all of them.
 *
 * @remarks
 * Reads `pushTokens` off the user record - one entry per device that user has
 * signed in on - and hands them to {@link sendPushNotifications}. A user who
 * has never allowed notifications simply has none, and nothing is sent.
 *
 * Never throws: both the database read and the send are caught and logged, so
 * a caller can fire this without awaiting anything but the promise.
 */
export async function notifyUser(
  userId: Types.ObjectId | string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    const user = await User.findById(userId)
      .select("pushTokens")
      .lean<{ pushTokens?: string[] } | null>();

    await sendPushNotifications(user?.pushTokens ?? [], title, body, data);
  } catch (error) {
    console.error("Failed to notify user", error);
  }
}
