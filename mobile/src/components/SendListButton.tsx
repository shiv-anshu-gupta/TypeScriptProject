/**
 * The Send control for the draft list, in its two shapes.
 *
 * @packageDocumentation
 */

import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { useSendDraft } from "@/features/customer/draft-list/use-send-draft";
import { Button } from "@/components/ui/Button";
import { PhonePrompt } from "@/components/PhonePrompt";

type SendListButtonProps = {
  variant: "pill" | "block";
};

/**
 * The button that sends the customer's list to the shop, showing how many
 * items are going and a spinner while it sends.
 *
 * @remarks
 * The one Send control for the draft list. Both shapes run the same send flow
 * (validation, sign-in, first-time mobile number, submit) and own the phone
 * prompt that flow may open.
 *
 * All of that lives in `useSendDraft`, not here: this component is the two
 * shapes plus a `Keyboard.dismiss()` so the customer can see it sending. It
 * always mounts {@link PhonePrompt}, which opens as a second sheet over the
 * list sheet the first time a list is sent.
 *
 * The flow can navigate away — signed out, it closes the sheet and opens the
 * sign-in screen — so a caller should not assume the button leaves the
 * customer where they were.
 *
 * @param variant - "pill": the compact round button pinned in the list sheet's
 * header, so Send is always on screen whatever the keyboard or scroll
 * position. "block": the full-width button under the list on the Lists tab.
 */
export function SendListButton({ variant }: SendListButtonProps) {
  const { t } = useTranslation();
  const {
    filledRows,
    submitting,
    send,
    phonePromptOpen,
    closePhonePrompt,
    submitWithPhone,
  } = useSendDraft();
  const count = filledRows.length;
  const canSend = count > 0;

  const onSend = () => {
    Keyboard.dismiss(); // let the customer see it sending
    void send();
  };

  return (
    <>
      {variant === "pill" ? (
        <Pressable
          onPress={onSend}
          disabled={!canSend || submitting}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSend || submitting }}
          accessibilityLabel={
            count ? t("home.sendItems", { count }) : t("home.sendList")
          }
          className={`h-10 flex-row items-center gap-1.5 rounded-full pl-3.5 active:opacity-85 ${
            canSend ? "bg-primary pr-1.5" : "bg-primary/40 pr-3.5"
          }`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <MaterialCommunityIcons name="send" size={16} color="#ffffff" />
          )}
          <Text className="text-sm font-bold text-primary-foreground">
            {t("home.send")}
          </Text>
          {count ? (
            <View className="h-7 min-w-[28px] items-center justify-center rounded-full bg-white/25 px-1.5">
              <Text className="text-xs font-bold text-primary-foreground">
                {count}
              </Text>
            </View>
          ) : null}
        </Pressable>
      ) : (
        <Button
          label={count ? t("home.sendItems", { count }) : t("home.sendList")}
          size="lg"
          loading={submitting}
          disabled={!canSend}
          icon={
            !submitting && (
              <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
            )
          }
          onPress={onSend}
          className="shadow-lg"
          textClassName="font-bold tracking-wide"
        />
      )}

      <PhonePrompt
        open={phonePromptOpen}
        submitting={submitting}
        onClose={closePhonePrompt}
        onSubmit={submitWithPhone}
      />
    </>
  );
}
