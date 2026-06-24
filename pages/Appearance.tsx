import { Check } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { THEME_META, type ThemeKey } from '@/lib/companionTypes';
import { cn } from '@/lib/utils';

const THEME_PREVIEWS: Record<ThemeKey, { bg: string; primary: string; accent: string }> = {
  blossom: { bg: '#FFF1F7', primary: '#F9A8D4', accent: '#EC4899' },
  lavender: { bg: '#F5F3FF', primary: '#DDD6FE', accent: '#7C3AED' },
  ocean: { bg: '#E0F7FA', primary: '#80DEEA', accent: '#00BCD4' },
  matcha: { bg: '#F1F8E9', primary: '#C5E1A5', accent: '#7CB342' },
  sunset: { bg: '#FFF8F0', primary: '#FFCCBC', accent: '#FF7043' },
  midnight: { bg: '#1A1F3C', primary: '#3B4A8A', accent: '#6B7FD4' },
};

export default function Appearance() {
  const { t } = useLanguage();
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('appearance')} backTo="/settings" />
      <div className="px-4 py-5 space-y-5">
        <p className="text-sm text-muted-foreground">{t('choose_theme')}</p>
        <div className="grid grid-cols-2 gap-3">
          {themes.map(tkey => {
            const meta = THEME_META[tkey as ThemeKey];
            const preview = THEME_PREVIEWS[tkey as ThemeKey];
            const isActive = theme === tkey;

            return (
              <button
                key={tkey}
                onClick={() => setTheme(tkey as ThemeKey)}
                className={cn(
                  'relative p-3 rounded-2xl border-2 transition-all active:scale-[0.98]',
                  isActive
                    ? 'border-[var(--brand-accent)] bg-[var(--brand-surface)]'
                    : 'border-[hsl(var(--border))] bg-card hover:bg-muted/50'
                )}
              >
                {/* Mini preview */}
                <div
                  className="h-16 rounded-xl mb-2 overflow-hidden"
                  style={{ backgroundColor: preview.bg }}
                >
                  <div className="flex items-end justify-between h-full p-2">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: preview.primary }}
                    />
                    <div className="flex flex-col gap-1">
                      <div
                        className="w-12 h-2 rounded"
                        style={{ backgroundColor: preview.accent, opacity: 0.6 }}
                      />
                      <div
                        className="w-8 h-2 rounded"
                        style={{ backgroundColor: preview.accent, opacity: 0.4 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Theme name */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {meta.emoji} {meta.name}
                  </span>
                  {isActive && (
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-accent)] flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
