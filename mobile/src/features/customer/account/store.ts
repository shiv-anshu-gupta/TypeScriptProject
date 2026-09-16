import { create } from "zustand";
import { getCustomerProfile, type CustomerProfile } from "./api";

// The customer's saved profile - the name and mobile the shop sees on orders.
// Kept in a store rather than screen state because Home's avatar and the
// Account screen both show it, and a name edited on Account must change the
// initial on Home straight away.
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
