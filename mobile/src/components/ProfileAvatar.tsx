/**
 * The customer's avatar square.
 *
 * @packageDocumentation
 */

import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type ProfileAvatarProps = {
  name?: string;
  size: number;
};

/**
 * A rounded square in the brand colour showing the customer's first initial.
 *
 * @remarks
 * The customer's avatar: their initial on the brand colour. Shared by the Home
 * header and the Account screen so the two always match. Corner radius and
 * letter size scale with `size`, so every avatar is the same shape. With no
 * name (signed out) it shows a person glyph rather than a guessed letter.
 *
 * It reads no store. The caller supplies the name, which lets Home and Account
 * both prefer the saved profile over the Clerk account.
 *
 * @param size - The width and height in points. Everything else is derived
 * from it, so the shape is identical at any size.
 */
export function ProfileAvatar({ name, size }: ProfileAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase();

  return (
    <View
      style={{ width: size, height: size, borderRadius: size * 0.29 }}
      className="items-center justify-center bg-primary"
    >
      {initial ? (
        <Text
          style={{ fontSize: size * 0.36 }}
          className="font-bold text-primary-foreground"
        >
          {initial}
        </Text>
      ) : (
        <Feather name="user" size={size * 0.45} color="#ffffff" />
      )}
    </View>
  );
}
