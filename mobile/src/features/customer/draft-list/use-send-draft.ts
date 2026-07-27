import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@clerk/clerk-expo";

import type { RootStackParamList } from "@/navigation/types";
import { useCustomerGroceryListStore } from "../grocery-list/store";
import { useDraftListStore } from "./store";
import { toast } from "@/lib/toast";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// The ONE send flow for the draft list, shared by the Home paper and the
// Lists tab so the logic (validation, sign-in, submit, clear) never forks.
export function useSendDraft() {
  const navigation = useNavigation<Nav>();
  const { isSignedIn } = useAuth();

  const submitting = useCustomerGroceryListStore((state) => state.submitting);
  const submitList = useCustomerGroceryListStore((state) => state.submitList);

  const rows = useDraftListStore((state) => state.rows);
  const clearDraft = useDraftListStore((state) => state.clearDraft);

  const filledRows = rows.filter((row) => (row.name ?? "").trim().length > 0);

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

    const sent = await submitList({
      items: filledRows.map((row) => ({
        name: row.name.trim(),
        quantity: (row.quantity ?? "").trim(),
      })),
    });

    if (sent) {
      clearDraft();
      navigation.navigate("Tabs", { screen: "Lists" });
    }
  };

  return { filledRows, submitting, send };
}
