/**
 * i18next, configured for this app, plus the two helpers that make the
 * customer's choice of language survive a restart.
 *
 * @remarks
 * Importing this module initialises i18next as a side effect, which is why it
 * is imported at the root of the app before any screen renders. Its default
 * export is the initialised instance: use `useTranslation()` inside a
 * component, and `i18n.t(...)` from a store or any other non-React code.
 *
 * English is the source of truth. `Translations` is derived from the English
 * object, so a key added to `en.ts` and not to `hi.ts` is a TypeScript error,
 * and so is a stray key in `hi.ts`. `npx tsc --noEmit` is what catches it —
 * there is no lint rule and no test.
 *
 * @packageDocumentation
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { en } from "./en";
import { hi } from "./hi";

/**
 * AsyncStorage key holding the customer's chosen language.
 *
 * @remarks
 * Its absence is what makes a launch the *first* launch: the app shows the
 * language picker when nothing is stored here. Clearing it therefore brings
 * the picker back.
 */
export const LANGUAGE_KEY = "app_language";
/**
 * The languages the app ships with.
 *
 * @remarks
 * Adding one means a third resource file mirroring `en.ts`, an entry in
 * `resources` below, and a third button on the first-launch picker.
 */
export type AppLanguage = "en" | "hi";

// Default to Hindi (rural-first). The stored choice is applied on app start,
// and the first-launch picker sets it explicitly.
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: "hi",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: "v4",
});

/**
 * Reads back the customer's saved choice.
 *
 * @remarks
 * Anything unrecognised — a storage failure, or a language written by an
 * older build that no longer exists — reads as `null`. Never throws.
 *
 * @returns The saved language, or `null` when there is none, which the app
 * root treats as a first launch and answers with the language picker.
 */
export async function getStoredLanguage(): Promise<AppLanguage | null> {
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    return value === "en" || value === "hi" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Switches the app's language and remembers the choice.
 *
 * @remarks
 * The one way to change language: it writes the choice and switches i18next,
 * so no caller has to do both. Used by the first-launch picker and by the
 * language row on the Account screen.
 *
 * A storage failure is swallowed — the switch still happens for this session,
 * it just will not be remembered. The i18next change is awaited, so once this
 * resolves every mounted screen has re-rendered in the new language.
 */
export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // storage failure shouldn't block switching for the session
  }
  await i18n.changeLanguage(lang);
}

export default i18n;
