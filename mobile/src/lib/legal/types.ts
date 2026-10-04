/**
 * The shape of the three policy documents - Terms, Privacy, Refund - shared
 * word for word by the app and the website.
 *
 * @remarks
 * `content.ts` beside this file holds the text and is IDENTICAL in
 * `mobile/src/lib/legal/` and `client/src/lib/legal/`; change both together.
 * A paragraph that starts with "• " is drawn as a bullet.
 *
 * @packageDocumentation
 */

export type LegalDocId = "terms" | "privacy" | "refund";
export type LegalLang = "en" | "hi";

export type LegalSection = {
  heading: string;
  body: string[];
};

export type LegalDoc = {
  title: string;
  /** Shown under the title, e.g. "Last updated: 4 October 2026". */
  updated: string;
  intro?: string;
  sections: LegalSection[];
};

export type LegalLibrary = Record<LegalDocId, Record<LegalLang, LegalDoc>>;

export const LEGAL_DOC_IDS: LegalDocId[] = ["terms", "privacy", "refund"];
