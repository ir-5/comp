import { useState } from 'react';
import { Link } from 'wouter';
import { CalendarDays, Plus, Bell, AlarmClock, Star, ChevronDown, ChevronUp, CalendarRange, ListChecks, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import WaterGrid from '@/components/WaterGrid';
import MedChecklist from '@/components/MedChecklist';
import PlantCards from '@/components/PlantCard';
import TimerCard from '@/components/TimerCard';
import EventCalendar from '@/components/EventCalendar';
import EventList from '@/components/EventList';
import { useTimers, PRESET_TIMERS } from '@/hooks/useTimers';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn, uid } from '@/lib/utils';

interface ParsedEvent {
  id: string;
  type: string;
  title: string;
  datetime: string | null;
  recurrence: string | null;
}

interface Alarm {
  id: string;
  label: string;
  time: string;
}

export default function Timeline() {
  const { t } = useLanguage();
  const [events, setEvents] = useLocalStorage<ParsedEvent[]>('companion_events', []);
  const [alarms, setAlarms] = useLocalStorage<Alarm[]>('companion_alarms', []);
  const {
    timers, startTimer, pauseTimer, resumeTimer, cancelTimer,
    dismissCompleted, getDisplayTime, getProgress, togglePrioritize, prioritizedTimers
  } = useTimers();

  const [customMinutes, setCustomMinutes] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [alarmTime, setAlarmTime] = useState('');
  const [alarmLabel, setAlarmLabel] = useState('');
  const [showAlarmForm, setShowAlarmForm] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  function deleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  function addAlarm() {
    if (!alarmTime) return;
    setAlarms(prev => [...prev, { id: uid(), label: alarmLabel || 'Reminder', time: alarmTime }]);
    setAlarmTime('');
    setAlarmLabel('');
    setShowAlarmForm(false);
  }

  function deleteAlarm(id: string) {
    setAlarms(prev => prev.filter(a => a.id !== id));
  }

  function startCustomTimer() {
    const mins = parseInt(customMinutes);
    if (!mins || mins <= 0) return;
    startTimer(customLabel || `${mins}-min timer`, mins * 60 * 1000);
    setCustomMinutes('');
    setCustomLabel('');
  }

  const datedEventCount = events.filter(e => e.datetime).length;

  const activeTimers = timers.filter(t => !t.completed);
  const completedTimers = timers.filter(t => t.completed);
  const canPrioritize = prioritizedTimers.length < 2;

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your routines, all in one calm place.</p>
      </div>

      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4 space-y-1">
          <p className="text-sm font-semibold text-foreground mb-3">Water Today</p>
          <WaterGrid />
        </CardContent>
      </Card>

      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Medications</p>
          <MedChecklist />
        </CardContent>
      </Card>

      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Plant Care</p>
          <PlantCards />
        </CardContent>
      </Card>

      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <AlarmClock size={14} className="text-[var(--brand-accent)]" />
              Timers
            </p>
            {prioritizedTimers.length > 0 && (
              <span className="text-[10px] text-[hsl(220_40%_55%)] font-medium bg-[hsl(220_60%_96%)] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star size={9} fill="currentColor" />
                {prioritizedTimers.length}/2 pinned to Home
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {PRESET_TIMERS.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => startTimer(preset.label, preset.durationMs)}
                data-testid={`btn-timer-${preset.label.replace(/\s+/g, '-').toLowerCase()}`}
                className="h-10 text-xs border-[hsl(35_25%_88%)] bg-[hsl(40_30%_98%)] hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] px-2 text-left"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <Input
              type="number"
              placeholder="Minutes"
              min="1"
              value={customMinutes}
              onChange={e => setCustomMinutes(e.target.value)}
              data-testid="input-custom-timer-minutes"
              className="h-9 text-sm"
            />
            <Input
              placeholder="Label (optional)"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              data-testid="input-custom-timer-label"
              className="h-9 text-sm"
            />
            <Button
              size="sm"
              onClick={startCustomTimer}
              disabled={!customMinutes}
              data-testid="btn-start-custom-timer"
              className="h-9 px-3 bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0 shrink-0"
            >
              Start
            </Button>
          </div>

          {timers.length > 0 && (
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
              <Star size={10} />
              Tap the star icon to pin a timer to your Home screen (max 2)
            </p>
          )}

          <div className="space-y-2">
            {[...activeTimers, ...completedTimers].map(timer => (
              <TimerCard
                key={timer.id}
                timer={timer}
                displayTime={getDisplayTime(timer)}
                progress={getProgress(timer)}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onCancel={cancelTimer}
                onDismiss={dismissCompleted}
                onTogglePrioritize={togglePrioritize}
                canPrioritize={canPrioritize}
                showPrioritizeButton
              />
            ))}
            {timers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-1">No active timers — start one above!</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Bell size={14} className="text-[var(--brand-accent)]" />
              Alarms
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlarmForm(v => !v)}
              data-testid="btn-toggle-alarm-form"
              className="h-7 text-xs text-[hsl(150_25%_40%)] gap-1"
            >
              <Plus size={12} /> Add alarm
            </Button>
          </div>
          {showAlarmForm && (
            <div className="flex gap-2 mb-3">
              <Input type="time" value={alarmTime} onChange={e => setAlarmTime(e.target.value)} data-testid="input-alarm-time" className="h-9 text-sm" />
              <Input placeholder="Label" value={alarmLabel} onChange={e => setAlarmLabel(e.target.value)} data-testid="input-alarm-label" className="h-9 text-sm" />
              <Button size="sm" onClick={addAlarm} data-testid="btn-save-alarm" className="h-9 px-3 bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0 shrink-0">
                Save
              </Button>
            </div>
          )}
          {alarms.length > 0 ? (
            <div className="space-y-2">
              {alarms.map(alarm => (
                <div key={alarm.id} data-testid={`alarm-${alarm.id}`} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(40_20%_97%)]">
                  <div>
                    <p className="text-sm font-medium text-foreground">{alarm.label}</p>
                    <p className="text-xs text-muted-foreground">{alarm.time}</p>
                  </div>
                  <button onClick={() => deleteAlarm(alarm.id)} data-testid={`btn-delete-alarm-${alarm.id}`} className="text-muted-foreground hover:text-foreground p-1 transition-colors">×</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-1">No alarms set — add one above!</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowEvents(v => !v)}
              data-testid="btn-toggle-events"
              className="flex-1 flex items-center justify-between min-w-0"
            >
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays size={14} className="text-[hsl(220_40%_55%)]" />
                {t('upcoming_events')}
                {datedEventCount > 0 && (
                  <span className="text-[10px] font-medium bg-[hsl(220_60%_96%)] text-[hsl(220_40%_55%)] px-1.5 py-0.5 rounded-full">{datedEventCount}</span>
                )}
              </span>
              {showEvents ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>
            <Link
              href="/calendar"
              data-testid="link-open-calendar"
              className="shrink-0 text-[11px] text-[hsl(150_25%_40%)] font-medium flex items-center gap-0.5 hover:underline"
            >
              {t('cal_open_page')}
              <ChevronRight size={12} />
            </Link>
          </div>

          {showEvents && (
            <div className="mt-4">
              {datedEventCount === 0 ? (
                <div className="text-center py-6">
                  <p className="text-3xl mb-2">📅</p>
                  <p className="text-sm text-muted-foreground">{t('no_events_yet')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('events_hint')}</p>
                </div>
              ) : (
                <Tabs defaultValue="calendar" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-3">
                    <TabsTrigger value="calendar" data-testid="tab-calendar" className="text-xs gap-1.5">
                      <CalendarRange size={13} /> {t('calendar_view')}
                    </TabsTrigger>
                    <TabsTrigger value="list" data-testid="tab-list" className="text-xs gap-1.5">
                      <ListChecks size={13} /> {t('events_list')}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="calendar">
                    <EventCalendar events={events} />
                  </TabsContent>
                  <TabsContent value="list">
                    <EventList events={events} onDelete={deleteEvent} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
