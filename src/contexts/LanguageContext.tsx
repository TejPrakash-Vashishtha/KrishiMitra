import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, LanguageCode } from "../utils/translations";
import { EXTRA_KEYS } from "../utils/translations.extra";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("km_lang");
    return (saved as LanguageCode) || "en";
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("km_lang", lang);
  };

  const t = (key: string): string => {
    // Check main translations first
    const langDict = translations[language] || translations.en;
    let val = (langDict as any)[key];
    if (val !== undefined) return val;

    // Check extra translations
    const extraDict = EXTRA_KEYS[language] || EXTRA_KEYS.en;
    val = (extraDict as any)[key];
    if (val !== undefined) return val;

    // Fallback to English extra
    const enExtra = EXTRA_KEYS.en;
    val = (enExtra as any)[key];
    if (val !== undefined) return val;

    // Final fallback: English main
    return (translations.en as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
