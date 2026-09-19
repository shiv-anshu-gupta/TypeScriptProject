/**
 * What to call the customer.
 *
 * @packageDocumentation
 */

import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTranslation } from "react-i18next";

import { useCustomerAccountStore } from "./store";

/**
 * The one rule for what to call the customer, shared by every screen that
 * shows their name or initial so they can never disagree: the saved profile
 * name (what the shop sees), then the sign-in name, then a generic label.
 * Undefined when signed out - there is nobody to name.
 *
 * @remarks
 * The order is deliberate. The saved profile name leads because that is what
 * the shopkeeper sees on the order, so the app should call the customer the
 * same thing.
 *
 * The generic label is translated, so the result changes with the language
 * as well as with the profile. Callers take the first character for an
 * avatar initial; a name in Devanagari gives a Devanagari initial.
 *
 * @returns The name, or `undefined` when signed out — which callers render as
 * a sign-in prompt rather than as an empty name.
 */
export function useCustomerDisplayName(): string | undefined {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const profile = useCustomerAccountStore((state) => state.profile);

  if (!isSignedIn) return undefined;
  return profile?.name || user?.fullName || (t("account.customer") as string);
}
