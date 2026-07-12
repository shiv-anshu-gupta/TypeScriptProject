import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSignIn } from "@clerk/clerk-expo";

import { Button } from "@/components/ui/Button";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { toast } from "@/lib/toast";
import { getClerkErrorMessage } from "@/lib/clerk-error";

export function SignInScreen() {
  const navigation = useNavigation();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!isLoaded || submitting) return;
    setSubmitting(true);
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        navigation.goBack();
      } else {
        toast.error("Additional verification required");
      }
    } catch (error) {
      toast.error(getClerkErrorMessage(error, "Unable to sign in"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center gap-4 px-6">
        <View className="mb-2">
          <Text className="text-3xl font-semibold text-foreground">
            Welcome back
          </Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Sign in to continue shopping.
          </Text>
        </View>

        <View className="gap-1">
          <Text className="text-xs font-medium text-muted-foreground">
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#a1a1aa"
            className="h-12 rounded-xl border border-border bg-card px-3 text-foreground"
          />
        </View>

        <View className="gap-1">
          <Text className="text-xs font-medium text-muted-foreground">
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#a1a1aa"
            className="h-12 rounded-xl border border-border bg-card px-3 text-foreground"
          />
        </View>

        <Button
          label="Sign in"
          loading={submitting}
          onPress={onSubmit}
          className="mt-2"
        />

        <View className="my-1 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border" />
          <Text className="text-xs text-muted-foreground">or</Text>
          <View className="h-px flex-1 bg-border" />
        </View>

        <GoogleAuthButton onDone={() => navigation.goBack()} />

        <Button
          label="Create an account"
          variant="ghost"
          onPress={() => navigation.navigate("SignUp" as never)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
