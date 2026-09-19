/**
 * Sending the draft list to the shop.
 *
 * @packageDocumentation
 */

import { useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "../grocery-list/store";
import { isSendableRow, useDraftListStore } from "./store";
import { useGrocerySheetStore } from "../grocery-sheet/store";
import { toast } from "@/lib/toast";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The ONE send flow for the draft list, shared by the Home paper and the
// Lists tab so the logic (validation, sign-in, phone capture, submit, clear)
// never forks.

/**
 * Shortest item name the shop will accept.
 *
 * @remarks
 * A real item name is never one character — mirrors the server's
 * MIN_NAME_LEN.
 *
 * Checked here rather than left to the server so the customer sees which line
 * is wrong, by name, and can fix it — instead of the server silently dropping
 * it and the shop pricing a list with an item missing.
 */
const MIN_NAME_LEN = 2;

/**
 * The one send flow, and the state the Send button needs to draw itself.
 *
 * @remarks
 * Used by both shapes of the Send button — the pill in the list sheet's
 * header and the block button on the Lists tab — so validation, sign-in,
 * phone capture, submitting and clearing can never fork between them.
 *
 * `send()` walks the same path every time:
 *
 * 1. At least one line with a name, or a toast and stop.
 * 2. Every name at least {@link MIN_NAME_LEN} characters, or a toast naming
 *    the offending line and stop.
 * 3. Signed in, or: toast, dismiss the keyboard, **close the sheet**, and
 *    navigate to the login. The sheet is closed first because on Android it
 *    is drawn over the whole app and the login would open behind it.
 * 4. A mobile number on file, fetching the lists once to find out if it is
 *    not yet known. With none, the phone prompt opens and the submit happens
 *    later through `submitWithPhone`.
 * 5. Submit; on success clear the draft, close the sheet and go to the Lists
 *    tab.
 *
 * Only text is ever sent. A photo the customer took was read into these same
 * lines earlier and discarded there.
 *
 * Re-entry is guarded by a ref rather than by the store's `submitting`, which
 * covers only the POST: `send()` can await a list fetch before that, and a
 * second tap in the gap would send the whole list twice. `submitting` is
 * still returned, because that is the right thing to put a spinner on.
 *
 * Nothing here throws. Every failure ends in a toast and a `false`.
 *
 * @returns `filledRows` (what would be sent), `submitting`, `send`, and the
 * three pieces the caller needs to own the phone prompt: `phonePromptOpen`,
 * `closePhonePrompt` and `submitWithPhone`.
 */
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
  // True from the first tap until the list is on its way. `submitting` only
  // covers the POST itself, and send() can await a profile fetch before that -
  // a second tap in that gap would send the whole list twice.
  const sending = useRef(false);

  const filledRows = rows.filter(isSendableRow);

  const doSubmit = async (phone?: string) => {
    // Only text is ever sent. A photo the customer took was read into these
    // same lines earlier and discarded there.
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
      // If it was sent from the list sheet, put the sheet and keyboard away -
      // otherwise the sheet stays open over the Lists tab, hiding the list the
      // customer just sent.
      Keyboard.dismiss();
      useGrocerySheetStore.getState().close();
      navigation.navigate("Tabs", {
        screen: "Lists",
        params: { tab: "active" },
      });
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
      // Put the sheet away first: on Android it is drawn over the whole app,
      // so the login screen would open behind it and look like nothing
      // happened.
      Keyboard.dismiss();
      useGrocerySheetStore.getState().close();
      navigation.navigate("SignIn");
      return;
    }

    if (sending.current) return;
    sending.current = true;
    try {
      // Make sure we know whether the customer already has a number on file.
      let phone = useCustomerGroceryListStore.getState().customerPhone;
      if (phone === null) {
        await loadLists();
        phone = useCustomerGroceryListStore.getState().customerPhone;
      }

      // First-time sender with no number → ask for it, then submit from the
      // modal (which calls submitWithPhone).
      if (!phone) {
        setPhonePromptOpen(true);
        return;
      }

      await doSubmit();
    } finally {
      sending.current = false;
    }
  };

  // Called by the PhonePrompt modal once a valid number is entered.
  const submitWithPhone = async (phone: string) => {
    if (sending.current) return false;
    sending.current = true;
    try {
      return await doSubmit(phone);
    } finally {
      sending.current = false;
    }
  };

  return {
    filledRows,
    submitting,
    send,
    phonePromptOpen,
    closePhonePrompt: () => setPhonePromptOpen(false),
    submitWithPhone,
  };
}
