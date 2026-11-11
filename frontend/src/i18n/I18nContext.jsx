import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALES, detectLocale } from "./registry";

const I18nContext = createContext(null);

function lookup(messages, key) {
  return key.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), messages);
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLocale);

  const setLang = useCallback((next) => {
    if (!LOCALES[next]) return;
    setLangState(next);
    try {
      localStorage.setItem("cygen-lang", next);
    } catch (e) {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key) => {
      const dict = LOCALES[lang]?.messages || {};
      let value = lookup(dict, key);
      if (value === undefined) {
        value = lookup(LOCALES[DEFAULT_LOCALE].messages, key);
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] missing key "${key}" for locale "${lang}"${value !== undefined ? " — fell back to English" : ""}`);
        }
      }
      return value === undefined ? key : value;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, locales: LOCALES }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
