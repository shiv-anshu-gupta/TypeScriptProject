import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSSO } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import { useWarmUpBrowser } from "@/lib/use-warm-up-browser";
import { toast } from "@/lib/toast";
import { clerkErrorCode, useSessionGuard } from "@/lib/clerk-session";

const googleG = require("../../assets/google-g.png");

// Required so the auth session can be dismissed after the OAuth redirect.
WebBrowser.maybeCompleteAuthSession();

type GoogleAuthButtonProps = {
  onDone: () => void;
};

export function GoogleAuthButton({ onDone }: GoogleAuthButtonProps) {
  const { t } = useTranslation();
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const { activate, recoverExisting } = useSessionGuard();
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { createdSessionId, setActive, authSessionResult } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: Linking.createURL("/"),
        });

      // Clerk wasn't ready yet - nothing was attempted.
      if (!authSessionResult) {
        toast.error(t("auth.somethingWrong"));
        return;
      }
      // The customer closed the Google window without choosing an account.
      if (authSessionResult.type !== "success") return;

      if (createdSessionId && setActive) {
        if (await activate(createdSessionId, setActive)) onDone();
        else toast.error(t("auth.accountOnHold"));
      } else {
        // Google worked, but Clerk wants more before it creates the account
        // (a required field this app doesn't collect).
        toast.error(t("auth.setupIncomplete"));
      }
    } catch (error) {
      if (clerkErrorCode(error) === "session_exists") {
        if ((await recoverExisting()) === "signedIn") onDone();
        else toast.error(t("auth.tryAgain"));
        return;
      }
      console.warn("[auth] Google sign-in failed", error);
      toast.error(t("auth.googleFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      className="h-14 w-full flex-row items-center justify-center gap-3 rounded-2xl border border-[#d6ccb8] bg-card active:bg-secondary"
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#3c5a64" />
      ) : (
        <>
          <Image source={googleG} style={{ width: 22, height: 22 }} />
          <Text className="text-base font-bold text-foreground">
            {t("auth.continueGoogle")}
          </Text>
        </>
      )}
    </Pressable>
  );
}
