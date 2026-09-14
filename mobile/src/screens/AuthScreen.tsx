import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { cn } from "@/lib/utils";

const logo = require("../../assets/icon.png");

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Step = "email" | "code";
// Decided by the server, never by the customer: an email with an account
// signs in, a new one signs up. Both then confirm with the same 6-digit code.
type Mode = "signIn" | "signUp";

// Clerk reports failures as { errors: [{ code, message }] }. Its messages are
// English-only, so the common cases get our own (translated) wording.
function clerkErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: { code?: string }[] }).errors;
    return errors?.[0]?.code;
  }
  return undefined;
}

// On Android (edge-to-edge) the window doesn't shrink for the keyboard, so the
// screen pads its own bottom by the keyboard's height. RN reports that height
// minus the navigation bar, hence adding the bottom inset back.
function useKeyboardHeight() {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (event) =>
        setHeight(event.endCoordinates.height + (ios ? 0 : insets.bottom)),
    );
    const hide = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);
  return height;
}

// Six boxes over one invisible input: typing, pasting and the keyboard's
// code suggestion all go into the real field, the boxes just show it.
function CodeBoxes({
  value,
  onChange,
  invalid,
  autoFocus,
}: {
  value: string;
  onChange: (code: string) => void;
  invalid: boolean;
  autoFocus: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="flex-row gap-2">
      {Array.from({ length: CODE_LENGTH }, (_, i) => {
        const current = focused && i === Math.min(value.length, CODE_LENGTH - 1);
        return (
          <View
            key={i}
            className={cn(
              "h-14 flex-1 items-center justify-center rounded-xl border bg-card",
              current
                ? "border-2 border-primary"
                : invalid
                  ? "border-destructive"
                  : "border-border",
            )}
          >
            <Text className="text-2xl font-bold text-foreground">
              {value[i] ?? ""}
            </Text>
          </View>
        );
      })}
      <TextInput
        value={value}
        onChangeText={(text) =>
          onChange(text.replace(/\D/g, "").slice(0, CODE_LENGTH))
        }
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        maxLength={CODE_LENGTH}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
        style={[StyleSheet.absoluteFill, { opacity: 0 }]}
      />
    </View>
  );
}

// The one door into an account. Google is the quickest; email works for
// everyone else with a code instead of a password, so there's nothing to
// remember and no separate "sign up" to find.
export function AuthScreen() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);

  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } =
    useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } =
    useSignUp();
  const ready = signInLoaded && signUpLoaded;

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Keep the field being typed into above the keyboard.
  useEffect(() => {
    if (keyboardHeight > 0) {
      const id = setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: true }),
        60,
      );
      return () => clearTimeout(id);
    }
  }, [keyboardHeight, step]);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Android back on the code step returns to the email step, not out.
  useEffect(() => {
    if (step !== "code") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      backToEmail();
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const messageFor = (err: unknown) => {
    switch (clerkErrorCode(err)) {
      case "form_code_incorrect":
        return t("auth.codeWrong");
      case "verification_expired":
        return t("auth.codeExpired");
      case "too_many_requests":
      case "verification_failed":
        return t("auth.tooMany");
      case "form_identifier_invalid":
      case "form_param_format_invalid":
        return t("auth.emailInvalid");
      default:
        return t("auth.somethingWrong");
    }
  };

  const finish = async (sessionId: string | null, activate: typeof setSignInActive) => {
    if (!sessionId || !activate) {
      setError(t("auth.setupIncomplete"));
      return;
    }
    await activate({ session: sessionId });
    navigation.goBack();
  };

  // Email step: find out whether this email already has an account, then send
  // the code the matching way.
  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!EMAIL_RE.test(address)) {
      setError(t("auth.emailInvalid"));
      return;
    }
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    try {
      try {
        const attempt = await signIn.create({ identifier: address });
        const factor = attempt.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code",
        );
        if (!factor || !("emailAddressId" in factor)) {
          setError(t("auth.somethingWrong"));
          return;
        }
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: factor.emailAddressId,
        });
        setMode("signIn");
      } catch (err) {
        if (clerkErrorCode(err) !== "form_identifier_not_found") throw err;
        // No account yet - create one with this email.
        await signUp.create({ emailAddress: address });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setMode("signUp");
      }
      setEmail(address);
      setCode("");
      setResendIn(RESEND_SECONDS);
      setStep("code");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (entered = code) => {
    if (!ready || busy) return;
    if (mode === "signUp" && name.trim().length < 2) {
      setError(t("account.nameRequired"));
      return;
    }
    if (entered.length !== CODE_LENGTH) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "signIn") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: entered,
        });
        await finish(
          result.status === "complete" ? result.createdSessionId : null,
          setSignInActive,
        );
      } else {
        await signUp.update({ firstName: name.trim() });
        const result = await signUp.attemptEmailAddressVerification({
          code: entered,
        });
        await finish(
          result.status === "complete" ? result.createdSessionId : null,
          setSignUpActive,
        );
      }
    } catch (err) {
      setError(messageFor(err));
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!ready || resendIn > 0 || busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "signIn") {
        const factor = signIn.supportedFirstFactors?.find(
          (f) => f.strategy === "email_code",
        );
        if (factor && "emailAddressId" in factor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: factor.emailAddressId,
          });
        }
      } else {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      }
      setCode("");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  };

  function backToEmail() {
    setStep("email");
    setCode("");
    setError("");
  }

  const onCodeChange = (next: string) => {
    setCode(next);
    if (error) setError("");
    // A full code submits itself - unless a new customer still owes a name.
    if (next.length === CODE_LENGTH && (mode === "signIn" || name.trim().length >= 2)) {
      void verify(next);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Top bar: close on the first step, back on the code step */}
      <View className="h-14 flex-row items-center px-2">
        <Pressable
          onPress={step === "code" ? backToEmail : () => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={step === "code" ? t("common.back") : t("common.close")}
          className="h-11 w-11 items-center justify-center rounded-full active:bg-secondary"
        >
          <Feather
            name={step === "code" ? "arrow-left" : "x"}
            size={22}
            color="#1f2a2e"
          />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: keyboardHeight + insets.bottom + 24,
        }}
      >
        {step === "email" ? (
          <>
            <View className="items-center pt-2">
              <Image
                source={logo}
                style={{ width: 72, height: 72, borderRadius: 20 }}
              />
              <Text className="mt-5 text-center text-2xl font-bold text-foreground">
                {t("auth.title")}
              </Text>
              <Text className="mt-2 text-center text-[15px] leading-6 text-muted-foreground">
                {t("auth.subtitle")}
              </Text>
            </View>

            <View className="mt-8">
              <GoogleAuthButton onDone={() => navigation.goBack()} />
            </View>

            <View className="my-6 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text className="text-sm text-muted-foreground">{t("auth.or")}</Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <Text className="mb-2 text-sm font-semibold text-foreground">
              {t("auth.emailLabel")}
            </Text>
            <TextInput
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError("");
              }}
              onSubmitEditing={() => void sendCode()}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="next"
              maxLength={100}
              placeholder={t("auth.emailPlaceholder")}
              placeholderTextColor="#ada291"
              className={cn(
                "h-14 rounded-xl border bg-card px-4 text-base text-foreground",
                error ? "border-destructive" : "border-border",
              )}
            />
            {error ? (
              <Text className="mt-2 text-sm text-destructive">{error}</Text>
            ) : null}

            <Button
              label={t("auth.continue")}
              size="lg"
              loading={busy}
              disabled={!ready}
              onPress={() => void sendCode()}
              className="mt-4 rounded-2xl"
              textClassName="text-base font-bold"
            />

            <View className="flex-1" />
            <Text className="mt-8 text-center text-xs leading-5 text-muted-foreground">
              {t("auth.consentPrefix")}{" "}
              <Text
                className="font-semibold text-foreground underline"
                onPress={() => navigation.navigate("Legal")}
              >
                {t("auth.privacyTerms")}
              </Text>
              {t("auth.consentSuffix")}
            </Text>
          </>
        ) : (
          <>
            <View className="items-center pt-2">
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Feather name="mail" size={28} color="#3c5a64" />
              </View>
              <Text className="mt-5 text-center text-2xl font-bold text-foreground">
                {t("auth.codeTitle")}
              </Text>
              <Text className="mt-2 text-center text-[15px] leading-6 text-muted-foreground">
                {t("auth.codeSentTo")}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <Text className="text-[15px] font-semibold text-foreground">
                  {email}
                </Text>
                <Text
                  onPress={backToEmail}
                  className="text-[15px] font-semibold text-primary underline"
                >
                  {t("auth.changeEmail")}
                </Text>
              </View>
            </View>

            {mode === "signUp" ? (
              <View className="mt-7">
                <Text className="mb-1 text-sm font-semibold text-foreground">
                  {t("auth.nameLabel")}
                </Text>
                <Text className="mb-2 text-xs leading-5 text-muted-foreground">
                  {t("auth.newAccount")}
                </Text>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError("");
                  }}
                  autoFocus
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  maxLength={50}
                  returnKeyType="next"
                  placeholder={t("auth.namePlaceholder")}
                  placeholderTextColor="#ada291"
                  className="h-14 rounded-xl border border-border bg-card px-4 text-base text-foreground"
                />
              </View>
            ) : null}

            <View className="mt-7">
              <CodeBoxes
                value={code}
                onChange={onCodeChange}
                invalid={!!error}
                autoFocus={mode === "signIn"}
              />
            </View>
            {error ? (
              <Text className="mt-3 text-center text-sm text-destructive">
                {error}
              </Text>
            ) : (
              <Text className="mt-3 text-center text-xs text-muted-foreground">
                {t("auth.checkSpam")}
              </Text>
            )}

            <Button
              label={t("auth.verifyContinue")}
              size="lg"
              loading={busy}
              disabled={code.length !== CODE_LENGTH}
              onPress={() => void verify()}
              className="mt-6 rounded-2xl"
              textClassName="text-base font-bold"
            />

            <Pressable
              onPress={() => void resend()}
              disabled={resendIn > 0 || busy}
              hitSlop={8}
              className="mt-5 items-center py-2"
            >
              <Text
                className={cn(
                  "text-sm font-semibold",
                  resendIn > 0 ? "text-muted-foreground" : "text-primary",
                )}
              >
                {resendIn > 0
                  ? t("auth.resendIn", { seconds: resendIn })
                  : t("auth.resend")}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}
