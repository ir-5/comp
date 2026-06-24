import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { useHomeConfig } from '@/hooks/useHomeConfig';
import { useLanguage } from '@/contexts/LanguageContext';
import { HomeSection } from '@/lib/companionTypes';
import { cn } from '@/lib/utils';

const SECTION_META: { key: HomeSection; emoji: string; labelKey: string }[] = [
  { key: 'whatToDoToday', emoji: '✅', labelKey: 'sec_whatToDoToday' },
  { key: 'noteBanner', emoji: '✏️', labelKey: 'sec_noteBanner' },
  { key: 'mood', emoji: '🙂', labelKey: 'sec_mood' },
  { key: 'parking', emoji: '📍', labelKey: 'sec_parking' },
  { key: 'upcomingEvents', emoji: '📅', labelKey: 'sec_upcomingEvents' },
  { key: 'statsStrip', emoji: '💧', labelKey: 'sec_statsStrip' },
  { key: 'quickTimer', emoji: '⏱️', labelKey: 'sec_quickTimer' },
  { key: 'healthSummary', emoji: '❤️', labelKey: 'sec_healthSummary' },
  { key: 'periodTracker', emoji: '🌸', labelKey: 'sec_periodTracker' },
  { key: 'recentNotes', emoji: '📝', labelKey: 'sec_recentNotes' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HomeCustomizeSheet({ open, onClose }: Props) {
  const { config, toggleSection, moveSection, resetConfig, isVisible } = useHomeConfig();
  const { t } = useLanguage();

  const ordered = config.order
    .map(key => SECTION_META.find(s => s.key === key))
    .filter((s): s is (typeof SECTION_META)[number] => !!s);

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="max-w-[480px] mx-auto rounded-t-3xl bg-[var(--brand-surface)] max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center justify-between">
            <span>{t('customize_home')}</span>
            <button onClick={resetConfig} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-normal">
              <RotateCcw size={12} /> {t('reset')}
            </button>
          </SheetTitle>
        </SheetHeader>
        <p className="text-xs text-muted-foreground mb-3">{t('customize_home_hint')}</p>
        <div className="space-y-2 pb-6">
          {ordered.map((s, idx) => {
            const visible = isVisible(s.key);
            return (
              <div
                key={s.key}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border bg-white',
                  visible ? 'border-[var(--brand-primary)]' : 'border-[hsl(35_25%_88%)] opacity-70',
                )}
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="flex-1 text-sm font-medium text-foreground">{t(s.labelKey)}</span>
                <div className="flex flex-col">
                  <button
                    onClick={() => moveSection(s.key, -1)}
                    disabled={idx === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                    aria-label={t('move_up')}
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => moveSection(s.key, 1)}
                    disabled={idx === ordered.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-0.5"
                    aria-label={t('move_down')}
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
                <Switch checked={visible} onCheckedChange={() => toggleSection(s.key)} />
              </div>
            );
          })}
        </div>
        <Button onClick={onClose} className="w-full bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0">
          {t('done')}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
