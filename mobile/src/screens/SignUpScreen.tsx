import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSignUp } from "@clerk/clerk-expo";

import type { RootStackParamList } from "@/navigation/types";

import { Button } from "@/components/ui/Button";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { toast } from "@/lib/toast";
import { getClerkErrorMessage } from "@/lib/clerk-error";

export function SignUpScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSignUp = async () => {
    if (!isLoaded || submitting) return;
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      toast.success("We sent a verification code to your email");
    } catch (error) {
      toast.error(getClerkErrorMessage(error, "Unable to sign up"));
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded || submitting) return;
    setSubmitting(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        navigation.goBack();
      } else {
        toast.error("Invalid code, please try again");
      }
    } catch (error) {
      toast.error(getClerkErrorMessage(error, "Verification failed"));
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
        {pendingVerification ? (
          <>
            <View className="mb-2">
              <Text className="text-3xl font-semibold text-foreground">
                Verify email
              </Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                Enter the code we sent to {email}.
              </Text>
            </View>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor="#ada291"
              className="h-12 rounded-xl border border-border bg-card px-3 text-center text-lg tracking-[6px] text-foreground"
            />
            <Button
              label="Verify & continue"
              loading={submitting}
              onPress={onVerify}
              className="mt-2"
            />
          </>
        ) : (
          <>
            <View className="mb-3">
              <Text className="text-3xl font-semibold text-foreground">
                Create account
              </Text>
              <Text className="mt-1 text-sm text-muted-foreground">
                The fastest way — one tap with Google.
              </Text>
            </View>

            {/* Primary path: Google (verified + one tap) */}
            <GoogleAuthButton onDone={() => navigation.goBack()} />

            {/* Passive consent — covers both Google and email sign-up */}
            <Text className="text-center text-xs leading-5 text-muted-foreground">
              By continuing, you agree to our{" "}
              <Text
                className="font-semibold text-foreground underline"
                onPress={() => navigation.navigate("Legal")}
              >
                Privacy Policy &amp; Terms
              </Text>
              .
            </Text>

            <View className="my-2 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text className="text-xs text-muted-foreground">
                or sign up with email
              </Text>
              <View className="h-px flex-1 bg-border" />
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
                placeholderTextColor="#ada291"
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
                placeholder="At least 8 characters"
                placeholderTextColor="#ada291"
                className="h-12 rounded-xl border border-border bg-card px-3 text-foreground"
              />
            </View>

            <Button
              label="Sign up with email"
              variant="outline"
              loading={submitting}
              onPress={onSignUp}
            />

            <Button
              label="I already have an account"
              variant="ghost"
              onPress={() => navigation.goBack()}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
