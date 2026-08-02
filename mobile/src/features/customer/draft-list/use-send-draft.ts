import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "../grocery-list/store";
import { useDraftListStore } from "./store";
import { toast } from "@/lib/toast";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The ONE send flow for the draft list, shared by the Home paper and the
// Lists tab so the logic (validation, sign-in, phone capture, submit, clear)
// never forks.
export function useSendDraft() {
  const navigation = useNavigation<Nav>();
  const { isSignedIn } = useAuth();

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
      toast.error("Write at least one item");
      return;
    }

    if (!isSignedIn) {
      toast.error("Sign in to send your list");
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
