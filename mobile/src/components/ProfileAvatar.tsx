import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

type ProfileAvatarProps = {
  name?: string;
  size: number;
};

// The customer's avatar: their initial on the brand colour. Shared by the Home
// header and the Account screen so the two always match. Corner radius and
// letter size scale with `size`, so every avatar is the same shape. With no
// name (signed out) it shows a person glyph rather than a guessed letter.
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
