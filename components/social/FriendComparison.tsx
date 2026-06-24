import { Droplets, Pill, Sprout, Footprints, CheckCircle2, StickyNote, Smile } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyStats, friendValue } from '@/hooks/useMyStats';
import { SHARING_KEYS, type SharingKey, type Friend, type SharingPrefs } from '@/lib/socialTypes';
import Avatar from '@/components/social/Avatar';

const META: Record<SharingKey, { icon: React.ComponentType<{ size?: number; className?: string }>; labelKey: string; unitKey?: string }> = {
  water: { icon: Droplets, labelKey: 'cat_water', unitKey: 'unit_days' },
  meds: { icon: Pill, labelKey: 'cat_meds', unitKey: 'unit_days' },
  plant: { icon: Sprout, labelKey: 'cat_plant', unitKey: 'unit_days' },
  steps: { icon: Footprints, labelKey: 'cat_steps', unitKey: 'unit_steps' },
  tasks: { icon: CheckCircle2, labelKey: 'cat_tasks', unitKey: 'unit_today' },
  notes: { icon: StickyNote, labelKey: 'cat_notes', unitKey: 'unit_notes' },
  mood: { icon: Smile, labelKey: 'cat_mood' },
};

const MOOD_EMOJI: Record<string, string> = {
  great: '😄', good: '🙂', okay: '😐', tired: '😴', sad: '😢', stressed: '😣',
};

function moodEmoji(m: string) { return MOOD_EMOJI[m] ?? '🙂'; }

interface Props {
  friend: Friend;
  mySharing: SharingPrefs; // what I let this friend see
}

export default function FriendComparison({ friend, mySharing }: Props) {
  const { t } = useLanguage();
  const { value: myValue } = useMyStats();

  const rows = SHARING_KEYS.filter(k => mySharing[k] && friend.sharing[k]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">{t('comparison_empty')}</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t('comparison_intro')}</p>
      {rows.map(key => {
        const { icon: Icon, labelKey, unitKey } = META[key];
        const mine = myValue(key);
        const theirs = friendValue(friend.stats, key);

        return (
          <div key={key} className="rounded-2xl border border-[hsl(35_25%_88%)] bg-white p-3" data-testid={`compare-${key}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={15} className="text-[var(--brand-accent)]" />
              <span className="text-sm font-semibold text-foreground">{t(labelKey)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Cell label={t('you')} value={mine} unit={unitKey ? t(unitKey) : ''} isMood={key === 'mood'} />
              <Cell label={friend.displayName} value={theirs} unit={unitKey ? t(unitKey) : ''} isMood={key === 'mood'} accent={friend.accent} avatar={friend} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Cell({ label, value, unit, isMood, accent, avatar }: {
  label: string; value: number | string; unit: string; isMood: boolean; accent?: string; avatar?: Friend;
}) {
  return (
    <div className="rounded-xl bg-[hsl(40_20%_97%)] p-2.5 flex flex-col items-center text-center">
      <div className="flex items-center gap-1.5 mb-1">
        {avatar ? <Avatar user={avatar} size={18} /> : <span className="w-[18px] h-[18px] rounded-full bg-[var(--brand-primary)]" />}
        <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px]">{label}</span>
      </div>
      {isMood ? (
        <span className="text-2xl leading-none">{moodEmoji(String(value))}</span>
      ) : (
        <>
          <span className="text-xl font-bold text-foreground" style={accent ? { color: 'var(--foreground)' } : undefined}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-[10px] text-muted-foreground">{unit}</span>}
        </>
      )}
    </div>
  );
}
