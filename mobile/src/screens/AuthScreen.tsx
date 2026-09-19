/**
 * The login as a modal screen.
 *
 * @packageDocumentation
 */

import { Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { AuthView } from "@/components/auth/AuthView";

/**
 * The sign-in page, presented as a modal with its own close button.
 *
 * @remarks
 * The login as its own screen - opened when a signed-out customer taps Send
 * (or anything else that needs an account), and closed once they're in.
 *
 * A thin wrapper: {@link AuthView} with a close bar. Signing in belongs to
 * {@link AuthPanel} inside it, and this screen only goes back once it is done,
 * returning the customer to whatever they were trying to do. It draws its own
 * close bar because the stack gives this route no header.
 */
export function AuthScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <AuthView
      onDone={() => navigation.goBack()}
      header={
        <View className="-mx-4 h-14 flex-row items-center">
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            className="h-11 w-11 items-center justify-center rounded-full active:bg-secondary"
          >
            <Feather name="x" size={22} color="#1f2a2e" />
          </Pressable>
        </View>
      }
    />
  );
}
