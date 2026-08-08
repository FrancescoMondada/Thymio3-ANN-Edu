import { createContext, useContext, useMemo, useState } from "react";
import { LOCALES, STRINGS, detectLocale, format, saveLocale } from "./catalog";

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectLocale);

  const value = useMemo(() => {
    const strings = STRINGS[locale] ?? STRINGS.en;

    return {
      locale,
      locales: LOCALES,
      t: (key) => strings[key] ?? STRINGS.en[key] ?? key,
      tf: (key, values) => format(strings[key] ?? STRINGS.en[key] ?? key, values),
      setLocale: (next) => {
        if (!STRINGS[next]) return;
        setLocaleState(next);
        saveLocale(next);
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
