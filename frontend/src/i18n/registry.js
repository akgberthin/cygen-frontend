// Locale registry: to add a language, drop a new JSON file in ./locales
// following the key structure of en.json, then add one entry here.
import en from "./locales/en.json";
import es from "./locales/es.json";

export const DEFAULT_LOCALE = "en";

export const LOCALES = {
  en: { code: "en", label: "English", shortLabel: "EN", messages: en },
  es: { code: "es", label: "Español", shortLabel: "ES", messages: es },
};

export const LOCALE_CODES = Object.keys(LOCALES);

export function detectLocale() {
  try {
    const saved = localStorage.getItem("cygen-lang");
    if (saved && LOCALES[saved]) return saved;
  } catch (e) {
    /* private mode */
  }
  const nav = (navigator.language || "").slice(0, 2).toLowerCase();
  return LOCALES[nav] ? nav : DEFAULT_LOCALE;
}
