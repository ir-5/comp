import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTaskCompletions } from '@/hooks/useTaskCompletions';
import { useStreaks } from '@/hooks/useStreaks';
import { useLanguage } from '@/contexts/LanguageContext';
import { todayKey, dateKey } from '@/lib/companionTypes';
import { cn, formatTime } from '@/lib/utils';

interface ParsedEvent { id: string; type: string; title: string; datetime: string | null; recurrence: string | null; }

const eventEmoji = (type: string) => (type === 'appointment' ? '📅' : type === 'plant' ? '🌿' : type === 'recurring' ? '💊' : '⏰');

export default function EventCalendar({ events }: { events: ParsedEvent[] }) {
  const { t, lang } = useLanguage();
  const { isDone, toggle } = useTaskCompletions();
  const { markComplete, undoComplete } = useStreaks();

  const [viewDate, setViewDate] = useState(new Date());
  const [selected, setSelected] = useState<string>(todayKey());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const datedEvents = events.filter(e => e.datetime);
  const eventDays = new Set(datedEvents.map(e => dateKey(e.datetime!)));

  const monthLabel = viewDate.toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', { month: 'long', year: 'numeric' });
  const weekdays = lang === 'ar' ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectedEvents = datedEvents
    .filter(e => dateKey(e.datetime!) === selected)
    .sort((a, b) => new Date(a.datetime!).getTime() - new Date(b.datetime!).getTime());

  function dayKeyOf(day: number) {
    return todayKey(new Date(year, month, day));
  }

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
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-[hsl(40_20%_95%)]" aria-label={t('prev_month')}>
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-[hsl(40_20%_95%)]" aria-label={t('next_month')}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map(w => (
          <span key={w} className="text-[10px] font-medium text-muted-foreground">{w}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const dk = dayKeyOf(day);
          const hasEvent = eventDays.has(dk);
          const isToday = dk === todayKey();
          const isSelected = dk === selected;
          return (
            <button
              key={dk}
              onClick={() => setSelected(dk)}
              className={cn(
                'aspect-square rounded-lg text-xs flex flex-col items-center justify-center relative transition-all',
                isSelected ? 'bg-[var(--brand-secondary)] text-[hsl(220_40%_30%)] font-bold' : hasEvent ? 'bg-[hsl(220_60%_97%)] text-[hsl(220_40%_45%)] font-semibold' : 'text-foreground hover:bg-[hsl(40_20%_95%)]',
                isToday && !isSelected && 'ring-1 ring-[var(--brand-primary)]',
              )}
            >
              {day}
              {hasEvent && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[hsl(220_50%_60%)]" />}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      <div className="pt-2 border-t border-[hsl(35_25%_92%)]">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          {new Date(selected + 'T00:00:00').toLocaleDateString(lang === 'ar' ? 'ar' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>
        {selectedEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">{t('no_events_this_day')}</p>
        ) : (
          <div className="space-y-1.5">
            {selectedEvents.map(ev => {
              const d = dateKey(ev.datetime!);
              const done = isDone(d, `event:${ev.id}:${d}`);
              return (
                <div key={ev.id} className={cn('flex items-center gap-2.5 p-2 rounded-lg border', done ? 'border-[hsl(35_25%_90%)] bg-[hsl(40_20%_98%)] opacity-60' : 'border-[var(--brand-secondary)] bg-[hsl(220_40%_98%)]')}>
                  <button
                    onClick={() => toggleEvent(ev)}
                    className={cn('shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all active:scale-90', done ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white' : 'border-[hsl(35_25%_80%)] text-transparent')}
                    aria-label={done ? t('mark_undone') : t('mark_done')}
                  >
                    <Check size={11} strokeWidth={3} />
                  </button>
                  <span className="text-sm">{eventEmoji(ev.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', done ? 'line-through text-muted-foreground' : 'text-foreground')}>{ev.title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatTime(ev.datetime!)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
