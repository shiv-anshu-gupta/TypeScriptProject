import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import { useCustomerAccountStore } from "./store";

// The one rule for what to call the customer, shared by every screen that
// shows their name or initial so they can never disagree: the saved profile
// name (what the shop sees), then the sign-in name, then a generic label.
// Undefined when signed out - there is nobody to name.
export function useCustomerDisplayName(): string | undefined {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const profile = useCustomerAccountStore((state) => state.profile);

  if (!isSignedIn) return undefined;
  return profile?.name || user?.fullName || (t("account.customer") as string);
}
