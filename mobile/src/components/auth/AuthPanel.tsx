import { useEffect, useState } from "react";
import {
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSignIn, useSignUp } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { Button } from "@/components/ui/Button";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
import { clerkErrorCode, useSessionGuard } from "@/lib/clerk-session";
import { stripSpecials } from "@/lib/clean-text";
import { cn } from "@/lib/utils";

const logo = require("../../../assets/icon.png");

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Step = "email" | "code";
// Decided by the server, never by the customer: an email with an account
// signs in, a new one signs up. Both then confirm with the same 6-digit code.
type Mode = "signIn" | "signUp";

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
        const current =
          focused && i === Math.min(value.length, CODE_LENGTH - 1);
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
        // Room for a pasted code with spaces or dashes; the digits are taken
        // out in onChangeText, which keeps at most CODE_LENGTH of them.
        maxLength={CODE_LENGTH * 4}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        caretHidden
        style={[StyleSheet.absoluteFill, { opacity: 0 }]}
      />
    </View>
  );
}

type AuthPanelProps = {
  // Called once the customer is signed in.
  onDone: () => void;
  // Replaces the default line under the welcome title.
  subtitle?: string;
  // Push the consent line to the bottom of a full-height screen.
  grow?: boolean;
};

// The one door into an account, used wherever someone needs to log in: the
// Account and Lists tabs show it straight away, and sending a list opens it
// as its own screen. Google is the quickest; email works for everyone else
// with a code instead of a password, so there's nothing to remember and no
// separate "sign up" to find.
export function AuthPanel({ onDone, subtitle, grow }: AuthPanelProps) {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // The Account and Lists tabs stay mounted after you leave them, so every
  // effect below is tied to whether this copy is the one on screen.
  const isFocused = useIsFocused();

  const {
    signIn,
    setActive: setSignInActive,
    isLoaded: signInLoaded,
  } = useSignIn();
  const {
    signUp,
    setActive: setSignUpActive,
    isLoaded: signUpLoaded,
  } = useSignUp();
  const ready = signInLoaded && signUpLoaded;
  const { complete, clearPending, messageForOutcome, recoverExisting } =
    useSessionGuard();

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // A session left "pending" by an earlier attempt blocks every new login
  // with "session_exists" - clear it as soon as the login is on screen.
  useEffect(() => {
    if (ready && isFocused) void clearPending();
  }, [ready, isFocused, clearPending]);

  // Clerk keeps ONE sign-in attempt per device, but this panel is mounted on
  // the Account tab, the Lists tab and inside the SignIn screen. A copy left
  // on the code step in a hidden tab would send its code to whichever attempt
  // another screen started last ("that code isn't right", and Resend mailing
  // someone else's address), so leaving the screen puts it back to the start.
  useEffect(() => {
    if (!isFocused && step === "code") backToEmail();
  }, [isFocused, step]);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  // Android back on the code step returns to the email step, not out. Only
  // while this copy is on screen: a hidden one would swallow the back press
  // meant for the screen the customer is actually looking at.
  useEffect(() => {
    if (step !== "code" || !isFocused) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      backToEmail();
      return true;
    });
    return () => sub.remove();
  }, [step, isFocused]);

  // Clerk's own messages are English-only, so the common cases get our own
  // (translated) wording.
  const messageFor = (err: unknown) => {
    switch (clerkErrorCode(err)) {
      case "form_code_incorrect":
        return t("auth.codeWrong");
      case "verification_expired":
        return t("auth.codeExpired");
      case "too_many_requests":
        return t("auth.tooMany");
      // The code itself is burnt after too many wrong tries: waiting doesn't
      // help, only a new code does.
      case "verification_failed":
        return t("auth.codeDead");
      case "form_identifier_invalid":
      case "form_param_format_invalid":
        return t("auth.emailInvalid");
      default:
        return t("common.somethingWrong");
    }
  };

  const finish = async (
    sessionId: string | null,
    setActive: typeof setSignInActive,
  ) => {
    const outcome = await complete(sessionId, setActive);
    if (outcome === "done") {
      onDone();
      return;
    }
    // The attempt is spent either way (held back and cleared, or missing
    // something this app doesn't ask for) - start again from the email step.
    setStep("email");
    setError(t(messageForOutcome(outcome)));
  };

  // The device already holds a session: an active one means the customer is
  // in; a held-back one has been cleared, so the next try works.
  const handleExisting = async () => {
    if ((await recoverExisting()) === "signedIn") onDone();
    else setError(t("auth.tryAgain"));
  };

  // Ask Clerk to email a code for the sign-in attempt in progress. Throws if
  // this account has no email-code option, so the caller can say so rather
  // than pretend a code was sent.
  const sendSignInCode = async () => {
    const factor = signIn?.supportedFirstFactors?.find(
      (f) => f.strategy === "email_code",
    );
    if (!signIn || !factor || !("emailAddressId" in factor)) {
      throw new Error("no email_code factor on this account");
    }
    await signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: factor.emailAddressId,
    });
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
        await signIn.create({ identifier: address });
        await sendSignInCode();
        setMode("signIn");
      } catch (err) {
        if (clerkErrorCode(err) !== "form_identifier_not_found") throw err;
        // No account yet - create one with this email.
        await signUp.create({ emailAddress: address });
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setMode("signUp");
      }
      setEmail(address);
      setCode("");
      setResendIn(RESEND_SECONDS);
      setStep("code");
    } catch (err) {
      if (clerkErrorCode(err) === "session_exists") await handleExisting();
      else setError(messageFor(err));
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
        // Only when it has changed: a retry after a wrong code would
        // otherwise make an extra round trip before checking the code.
        if (signUp.firstName !== name.trim()) {
          await signUp.update({ firstName: name.trim() });
        }
        const result = await signUp.attemptEmailAddressVerification({
          code: entered,
        });
        await finish(
          result.status === "complete" ? result.createdSessionId : null,
          setSignUpActive,
        );
      }
    } catch (err) {
      if (clerkErrorCode(err) === "session_exists") await handleExisting();
      else setError(messageFor(err));
      // Only clear what was actually tried: the customer may already have
      // corrected a digit while the wrong code was being checked.
      setCode((current) => (current === entered ? "" : current));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!ready || resendIn > 0 || busy) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "signIn") await sendSignInCode();
      else
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
      setCode("");
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      // Nothing was sent, so the countdown must NOT start - otherwise the
      // customer waits for an email that was never on its way.
      if (clerkErrorCode(err) === "session_exists") await handleExisting();
      else setError(messageFor(err));
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
    if (
      next.length === CODE_LENGTH &&
      (mode === "signIn" || name.trim().length >= 2)
    ) {
      void verify(next);
    }
  };

  if (step === "code") {
    return (
      <View>
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
          <View className="mt-1 flex-row flex-wrap items-center justify-center gap-x-2">
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
                // The shop sees this name on every order, so it goes through
                // the same filter as the profile name.
                setName(stripSpecials(text));
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
      </View>
    );
  }

  return (
    <View style={grow ? { flexGrow: 1 } : undefined}>
      <View className="items-center pt-2">
        <Image
          source={logo}
          style={{ width: 72, height: 72, borderRadius: 20 }}
        />
        <Text className="mt-5 text-center text-2xl font-bold text-foreground">
          {t("auth.title")}
        </Text>
        <Text className="mt-2 text-center text-[15px] leading-6 text-muted-foreground">
          {subtitle ?? t("auth.subtitle")}
        </Text>
      </View>

      <View className="mt-8">
        <GoogleAuthButton onDone={onDone} />
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

      {grow ? <View className="flex-1" /> : null}
      <Text className="mt-6 text-center text-xs leading-5 text-muted-foreground">
        {t("auth.consentPrefix")}{" "}
        <Text
          className="font-semibold text-foreground underline"
          onPress={() => navigation.navigate("Legal")}
        >
          {t("auth.privacyTerms")}
        </Text>
        {t("auth.consentSuffix")}
      </Text>
    </View>
  );
}
