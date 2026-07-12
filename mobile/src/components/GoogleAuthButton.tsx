import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useSSO } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

import { useWarmUpBrowser } from "@/lib/use-warm-up-browser";
import { toast } from "@/lib/toast";
import { getClerkErrorMessage } from "@/lib/clerk-error";

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
      className={
        loading
          ? "h-11 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card opacity-60"
          : "h-11 flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card"
      }
    >
      {loading ? (
        <ActivityIndicator size="small" color="#18181b" />
      ) : (
        <View className="flex-row items-center gap-2">
          <Feather name="chrome" size={18} color="#18181b" />
          <Text className="text-sm font-semibold text-foreground">
            Continue with Google
          </Text>
        </View>
      )}
    </Pressable>
  );
}
