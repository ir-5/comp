import SubPageHeader from '@/components/SubPageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Appearance() {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('appearance')} backTo="/settings" />
      <div className="px-4 py-5 space-y-5">
        <div className="rounded-2xl border border-[hsl(35_25%_88%)] bg-white overflow-hidden divide-y divide-[hsl(35_25%_92%)]">
          {(['neutral', 'ember', 'mist'] as const).map(tkey => (
            <button
              key={tkey}
              onClick={() => setTheme(tkey)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-start hover:bg-[hsl(40_20%_97%)] transition-colors"
            >
              <span className="flex-1 text-sm font-medium text-foreground capitalize">{tkey}</span>
              {theme === tkey && <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
