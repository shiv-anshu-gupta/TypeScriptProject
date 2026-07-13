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

/** Look up a user's devices and push to all of them. */
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
