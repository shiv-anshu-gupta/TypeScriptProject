import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "../grocery-list/store";
import { useDraftListStore } from "./store";
import { toast } from "@/lib/toast";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The ONE send flow for the draft list, shared by the Home paper and the
// Lists tab so the logic (validation, sign-in, phone capture, submit, clear)
// never forks.
// A real item name is never one character — mirrors the server's MIN_NAME_LEN.
const MIN_NAME_LEN = 2;

export function useSendDraft() {
  const navigation = useNavigation<Nav>();
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();

  const submitting = useCustomerGroceryListStore((state) => state.submitting);
  const submitList = useCustomerGroceryListStore((state) => state.submitList);
  const loadLists = useCustomerGroceryListStore((state) => state.loadLists);

  const rows = useDraftListStore((state) => state.rows);
  const clearDraft = useDraftListStore((state) => state.clearDraft);

  const [phonePromptOpen, setPhonePromptOpen] = useState(false);

  const filledRows = rows.filter((row) => (row.name ?? "").trim().length > 0);

  const doSubmit = async (phone?: string) => {
    const sent = await submitList({
      items: filledRows.map((row) => ({
        name: row.name.trim(),
        quantity: (row.quantity ?? "").trim(),
      })),
      ...(phone ? { phone } : {}),
    });

    if (sent) {
      clearDraft();
      setPhonePromptOpen(false);
      navigation.navigate("Tabs", { screen: "Lists" });
    }
    return sent;
  };

  const send = async () => {
    if (!filledRows.length) {
      toast.error(t("home.writeAtLeastOne"));
      return;
    }

    // Catch a stray single-letter row here, with the name in the message, so
    // the customer can fix it — rather than having the server silently drop it.
    const tooShort = filledRows.find(
      (row) => row.name.trim().length < MIN_NAME_LEN,
    );
    if (tooShort) {
      toast.error(t("home.nameTooShort", { name: tooShort.name.trim() }));
      return;
    }

    if (!isSignedIn) {
      toast.error(t("home.signInToSend"));
      navigation.navigate("SignIn");
      return;
    }

    // Make sure we know whether the customer already has a number on file.
    let phone = useCustomerGroceryListStore.getState().customerPhone;
    if (phone === null) {
      await loadLists();
      phone = useCustomerGroceryListStore.getState().customerPhone;
    }

    // First-time sender with no number → ask for it, then submit from the modal.
    if (!phone) {
      setPhonePromptOpen(true);
      return;
    }

    await doSubmit();
  };

  // Called by the PhonePrompt modal once a valid number is entered.
  const submitWithPhone = (phone: string) => doSubmit(phone);

  return {
    filledRows,
    submitting,
    send,
    phonePromptOpen,
    closePhonePrompt: () => setPhonePromptOpen(false),
    submitWithPhone,
  };
}
