import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { useTaskCompletions } from '@/hooks/useTaskCompletions';
import { useStreaks } from '@/hooks/useStreaks';
import { useLanguage } from '@/contexts/LanguageContext';
import { dateKey, todayKey, addDaysKey } from '@/lib/companionTypes';
import { cn, formatTime, formatDate } from '@/lib/utils';

interface ParsedEvent { id: string; type: string; title: string; datetime: string | null; recurrence: string | null; }

type Filter = 'newest' | 'oldest' | 'today' | 'week' | 'month' | 'completed' | 'pending';

const FILTERS: { key: Filter; labelKey: string }[] = [
  { key: 'newest', labelKey: 'filter_newest' },
  { key: 'oldest', labelKey: 'filter_oldest' },
  { key: 'today', labelKey: 'filter_today' },
  { key: 'week', labelKey: 'filter_week' },
  { key: 'month', labelKey: 'filter_month' },
  { key: 'pending', labelKey: 'filter_pending' },
  { key: 'completed', labelKey: 'filter_completed' },
];

const eventEmoji = (type: string) => (type === 'appointment' ? '📅' : type === 'plant' ? '🌿' : type === 'recurring' ? '💊' : '⏰');

export default function EventList({ events, onDelete }: { events: ParsedEvent[]; onDelete?: (id: string) => void }) {
  const { t } = useLanguage();
  const { isDone, toggle } = useTaskCompletions();
  const { markComplete, undoComplete } = useStreaks();
  const [filter, setFilter] = useState<Filter>('newest');

  const today = todayKey();
  const weekEnd = addDaysKey(today, 7);
  const monthEnd = addDaysKey(today, 31);

  const dated = events.filter(e => e.datetime);

  function matchesFilter(ev: ParsedEvent): boolean {
    const d = dateKey(ev.datetime!);
    const done = isDone(d, `event:${ev.id}:${d}`);
    switch (filter) {
      case 'today': return d === today;
      case 'week': return d >= today && d <= weekEnd;
      case 'month': return d >= today && d <= monthEnd;
      case 'completed': return done;
      case 'pending': return !done;
      default: return true;
    }
  }

  const filtered = dated.filter(matchesFilter).sort((a, b) => {
    const ta = new Date(a.datetime!).getTime();
    const tb = new Date(b.datetime!).getTime();
    return filter === 'oldest' ? ta - tb : tb - ta;
  });

  function toggleEvent(ev: ParsedEvent) {
    const d = dateKey(ev.datetime!);
    const key = `event:${ev.id}:${d}`;
    const nowOn = toggle(d, key, { title: ev.title, category: 'event', source: 'event', refId: ev.id, emoji: eventEmoji(ev.type) });
    if (d === todayKey()) {
      if (nowOn) markComplete('tasks');
      else undoComplete('tasks');
    }
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
              filter === f.key ? 'border-[var(--brand-secondary)] bg-[var(--brand-secondary)] text-[hsl(220_30%_35%)]' : 'border-[hsl(35_25%_88%)] text-muted-foreground bg-white',
            )}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">{t('no_events_filter')}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(ev => {
            const d = dateKey(ev.datetime!);
            const done = isDone(d, `event:${ev.id}:${d}`);
            return (
              <div key={ev.id} className={cn('flex items-center gap-2.5 p-2.5 rounded-lg border', done ? 'border-[hsl(35_25%_90%)] bg-[hsl(40_20%_98%)] opacity-60' : 'border-[hsl(35_25%_88%)] bg-white')}>
                <button
                  onClick={() => toggleEvent(ev)}
                  className={cn('shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90', done ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white' : 'border-[hsl(35_25%_80%)] text-transparent hover:border-[hsl(150_30%_55%)]')}
                  aria-label={done ? t('mark_undone') : t('mark_done')}
                >
                  <Check size={13} strokeWidth={3} />
                </button>
                <span className="text-base">{eventEmoji(ev.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', done ? 'line-through text-muted-foreground' : 'text-foreground')}>{ev.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(ev.datetime!)} · {formatTime(ev.datetime!)}
                    {ev.recurrence ? ` · ${t('repeats')} ${ev.recurrence}` : ''}
                  </p>
                </div>
                {onDelete && (
                  <button onClick={() => onDelete(ev.id)} className="text-muted-foreground hover:text-red-400 p-1 shrink-0" aria-label={t('delete')}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
