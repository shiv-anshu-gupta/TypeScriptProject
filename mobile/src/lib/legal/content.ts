/**
 * PLACEHOLDER - replaced by the real text. Do not ship.
 *
 * @packageDocumentation
 */
import type { LegalDoc, LegalLibrary } from "./types";

const stub = (title: string): LegalDoc => ({
  title,
  updated: "",
  sections: [{ heading: "", body: ["…"] }],
});

export const LEGAL: LegalLibrary = {
  terms: { en: stub("Terms & Conditions"), hi: stub("नियम और शर्तें") },
  privacy: { en: stub("Privacy Policy"), hi: stub("गोपनीयता नीति") },
  refund: { en: stub("Refund Policy"), hi: stub("रिफ़ंड नीति") },
};
