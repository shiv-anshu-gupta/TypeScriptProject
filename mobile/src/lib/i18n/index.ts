import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { en } from "./en";
import { hi } from "./hi";

export const LANGUAGE_KEY = "app_language";
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

export async function getStoredLanguage(): Promise<AppLanguage | null> {
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    return value === "en" || value === "hi" ? value : null;
  } catch {
    return null;
  }
}

export async function setAppLanguage(lang: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // storage failure shouldn't block switching for the session
  }
  await i18n.changeLanguage(lang);
}

export default i18n;
