/**
 * The customer's saved profile, shared by every screen that shows their name.
 *
 * @packageDocumentation
 */

import { create } from "zustand";
import { getCustomerProfile, type CustomerProfile } from "./api";

/**
 * The customer's saved profile - the name and mobile the shop sees on orders.
 * Kept in a store rather than screen state because Home's avatar and the
 * Account screen both show it, and a name edited on Account must change the
 * initial on Home straight away.
 */
type CustomerAccountStore = {
  profile: CustomerProfile | null;
  loadProfile: () => Promise<void>;
  setProfile: (profile: CustomerProfile) => void;
  clear: () => void;
};

// A profile still loading when the customer signs out must not land in the
// store afterwards - the next person on this phone would see their name,
// email and mobile number.
let loadTicket = 0;

/**
 * Holds the customer's saved profile, or `null` when it has not been loaded.
 *
 * @remarks
 * Written by `loadProfile` at startup and on every visit to the Account
 * screen, and by `setProfile` after a successful edit — the profile sheet
 * puts the server's answer straight in rather than reloading.
 *
 * Nothing is persisted. It is fetched at startup when Clerk says somebody is
 * signed in, and cleared on sign-out, which is what stops a shared phone
 * showing the previous customer's name.
 *
 * A failed load is deliberately a no-op rather than a reset: screens keep
 * showing the name they have and fall back to the Clerk name until the next
 * load succeeds.
 *
 * The invariant worth knowing is the ticket. Every load takes one, and
 * `clear()` takes one too, so a profile still in flight when the customer
 * signs out can never land afterwards and show the next person their name,
 * email and mobile number.
 */
export const useCustomerAccountStore = create<CustomerAccountStore>((set) => ({
  profile: null,
  loadProfile: async () => {
    const ticket = ++loadTicket;
    try {
      const profile = await getCustomerProfile();
      if (ticket === loadTicket) set({ profile });
    } catch {
      // offline - screens fall back to the sign-in name until the next load
    }
  },
  setProfile: (profile) => set({ profile }),
  clear: () => {
    loadTicket++;
    set({ profile: null });
  },
}));
