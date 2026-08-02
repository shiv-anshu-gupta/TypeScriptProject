import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSSO } from "@clerk/clerk-expo";

import { useWarmUpBrowser } from "@/lib/use-warm-up-browser";
import { toast } from "@/lib/toast";
import { getClerkErrorMessage } from "@/lib/clerk-error";

const googleG = require("../../assets/google-g.png");

// Required so the auth session can be dismissed after the OAuth redirect.
WebBrowser.maybeCompleteAuthSession();

type GoogleAuthButtonProps = {
  onDone: () => void;
};

export function GoogleAuthButton({ onDone }: GoogleAuthButtonProps) {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);

  const onPress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/"),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        onDone();
      } else {
        // Additional steps (e.g. MFA) are not handled in this demo flow.
        toast.error("Additional verification required");
      }
    } catch (error) {
      toast.error(getClerkErrorMessage(error, "Google sign-in failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="h-14 w-full flex-row items-center justify-center gap-3 rounded-2xl border border-border bg-card active:opacity-90"
      style={{
        opacity: loading ? 0.7 : 1,
        elevation: 3,
        shadowColor: "#1f2a2e",
        shadowOpacity: 0.14,
        shadowRadius: 7,
        shadowOffset: { width: 0, height: 3 },
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#3c5a64" />
      ) : (
        <>
          <Image source={googleG} style={{ width: 22, height: 22 }} />
          <Text className="text-base font-bold text-foreground">
            Continue with Google
          </Text>
        </>
      )}
    </Pressable>
  );
}
