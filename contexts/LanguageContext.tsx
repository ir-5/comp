import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { strings, Language } from '@/lib/i18n';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  dir: 'ltr',
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('companion_lang') as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  function t(key: string): string {
    return strings[lang]?.[key] ?? strings['en']?.[key] ?? key;
  }

  function setLang(l: Language) {
    setLangState(l);
    try {
      localStorage.setItem('companion_lang', l);
    } catch {}
  }

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, isRTL: dir === 'rtl' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
