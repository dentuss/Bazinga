import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "@/locales/en";
import uk from "@/locales/uk";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "uk"],
    defaultNS: "common",
    resources: {
      en: { common: en },
      uk: { common: uk },
    },
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "bazinga_lang",
      caches: ["localStorage"],
    },
  });

export default i18n;
