import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      aria-label="Switch language"
      title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[hsl(35_25%_88%)] bg-white/80 hover:bg-[var(--brand-primary)] transition-colors text-xs font-semibold text-foreground shadow-sm"
      style={{ fontFamily: lang === 'ar' ? '"Noto Naskh Arabic", serif' : 'inherit' }}
    >
      <span className="text-sm leading-none">🌐</span>
      <span>{lang === 'en' ? 'عربي' : 'EN'}</span>
    </button>
  );
}
