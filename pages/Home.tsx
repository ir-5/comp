import { useState, useEffect, type ReactElement } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { MapPin, ChevronRight, Timer, User, Sparkles, Star, Settings2, Droplets, Pill, Heart, StickyNote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MoodSelector from '@/components/MoodSelector';
import WhatToDoToday from '@/components/WhatToDoToday';
import HomeCustomizeSheet from '@/components/HomeCustomizeSheet';
import StreakBadge from '@/components/StreakBadge';
import PeriodTracker from '@/components/PeriodTracker';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTimers, PRESET_TIMERS } from '@/hooks/useTimers';
import { useStreaks } from '@/hooks/useStreaks';
import { useHomeConfig } from '@/hooks/useHomeConfig';
import TimerCard from '@/components/TimerCard';
import { getGreeting, timeAgo, timeUntil, todayStr, formatTime } from '@/lib/utils';
import { HomeSection, SavedNote } from '@/lib/companionTypes';
import { useIsPro } from '@/components/ProGate';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useProPopup } from '@/components/ProPopup';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ParkingData { lat: number; lng: number; address?: string; timestamp: number; manualAddress?: string; }
interface ParsedEvent { id: string; type: string; title: string; datetime: string | null; recurrence: string | null; }
interface WaterData { date: string; count: number; goal: number; unit?: 'cups' | 'ml' | 'L'; clickAmount?: number; }
interface MedData { date: string; morning: boolean; afternoon: boolean; evening: boolean; medName: string; }
interface PlantData { id: string; name: string; frequencyDays: number; lastWatered: string; }

const QUICK_TIMERS = PRESET_TIMERS.slice(0, 2);
const WATER_UNITS: ('cups' | 'ml' | 'L')[] = ['cups', 'ml', 'L'];

function getGreetingByLang(_lang: string, t: (k: string) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t('greeting_morning');
  if (h < 17) return t('greeting_afternoon');
  return t('greeting_evening');
}

function formatWaterCount(count: number, unit: 'cups' | 'ml' | 'L' = 'cups'): string {
  if (unit === 'ml') return `${count * 250}ml`;
  if (unit === 'L') return `${(count * 0.25).toFixed(1)}L`;
  return String(count);
}

function formatWaterGoal(goal: number, unit: 'cups' | 'ml' | 'L' = 'cups'): string {
  if (unit === 'ml') return `${goal * 250}ml`;
  if (unit === 'L') return `${(goal * 0.25).toFixed(1)}L`;
  return `${goal} cups`;
}

export default function Home() {
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const isPro = useIsPro();
  const { t, lang } = useLanguage();
  const { profile, setProfile, isBirthday, birthdayProActive, proLabel, moodQuestion } = useProfile();
  const { showProPopup } = useProPopup();
  const { markComplete } = useStreaks();
  const { config, isVisible } = useHomeConfig();
  const [, navigate] = useLocation();

  const [parking] = useLocalStorage<ParkingData | null>('companion_parking', null);
  const [events] = useLocalStorage<ParsedEvent[]>('companion_events', []);
  const [water, setWater] = useLocalStorage<WaterData>('companion_water', { date: todayStr(), count: 0, goal: 8 });
  const [meds, setMeds] = useLocalStorage<MedData>('companion_meds', { date: todayStr(), morning: false, afternoon: false, evening: false, medName: '' });
  const [plants, setPlants] = useLocalStorage<PlantData[]>('companion_plants', []);
  const [savedNotes] = useLocalStorage<SavedNote[]>('companion_saved_notes', []);

  const {
    timers, startTimer, pauseTimer, resumeTimer, cancelTimer,
    dismissCompleted, getDisplayTime, getProgress, togglePrioritize, prioritizedTimers
  } = useTimers();

  const [quickNote, setQuickNote] = useState('');
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showBirthdayExpiredPopup, setShowBirthdayExpiredPopup] = useState(false);
  const [birthdayExpiredDismissed] = useLocalStorage<boolean>('companion_birthday_popup_dismissed', false);
  const [, setBirthdayExpiredDismissed] = useLocalStorage<boolean>('companion_birthday_popup_dismissed', false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showWaterConfig, setShowWaterConfig] = useState(false);
  const [pulse, setPulse] = useState<string | null>(null);

  // Show profile setup after first sign in
  useEffect(() => {
    if (!isSignedIn || profile.profileSetup) return;
    const timer = setTimeout(() => setShowProfileSetup(true), 1000);
    return () => clearTimeout(timer);
  }, [isSignedIn, profile.profileSetup]);

  // Birthday Pro gift toast
  useEffect(() => {
    if (isBirthday && birthdayProActive && isSignedIn) {
      toast(t('birthday_pro_gift'), { duration: 6000 });
    }
  }, [isBirthday]);

  // Birthday Pro expired popup
  useEffect(() => {
    if (profile.birthdayProExpiry && !birthdayProActive && !birthdayExpiredDismissed) {
      const expiry = new Date(profile.birthdayProExpiry);
      if (new Date() > expiry) {
        setShowBirthdayExpiredPopup(true);
      }
    }
  }, [profile.birthdayProExpiry, birthdayProActive]);

  // Gender-based water goal default
  useEffect(() => {
    if (profile.gender && water.goal === 8) {
      const goal = profile.gender === 'male' ? 16 : profile.gender === 'female' ? 12 : 8;
      if (goal !== 8) setWater(prev => ({ ...prev, goal }));
    }
  }, [profile.gender]);

  const upcoming = events
    .filter(e => e.datetime && new Date(e.datetime) > new Date())
    .sort((a, b) => new Date(a.datetime!).getTime() - new Date(b.datetime!).getTime())
    .slice(0, 3);

  const waterCount = water.date === todayStr() ? water.count : 0;
  const waterGoal = water.goal ?? 8;
  const waterUnit = water.unit ?? 'cups';
  const waterClick = water.clickAmount ?? 1;
  const allMedsDone = meds.date === todayStr() && meds.morning && meds.afternoon && meds.evening;

  const nextPlant = plants
    .map(p => {
      const last = new Date(p.lastWatered);
      const next = new Date(last);
      next.setDate(next.getDate() + p.frequencyDays);
      return { ...p, daysUntil: Math.ceil((next.getTime() - Date.now()) / 86400000) };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)[0];

  const displayAddress = parking
    ? parking.manualAddress || parking.address || `${parking.lat.toFixed(4)}, ${parking.lng.toFixed(4)}`
    : null;

  const recentNotes = [...savedNotes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

  const completedTimers = timers.filter(t => t.completed);
  const canPrioritize = prioritizedTimers.length < 2;
  const hasPrioritized = prioritizedTimers.length > 0;
  const activeUnpinned = timers.filter(t => !t.isPrioritized && !t.completed);

  // Greeting
  const firstName = isSignedIn && user?.firstName ? user.firstName : '';
  let greeting = '';
  if (isSignedIn && firstName) {
    if (isBirthday) {
      greeting = `${t('happy_birthday')} ${firstName} 🎂`;
    } else {
      greeting = `${t('hello')}, ${firstName} 👋`;
    }
  } else {
    greeting = `${getGreetingByLang(lang, t)} 👋`;
  }

  function handleQuickNote() {
    if (!quickNote.trim()) return;
    navigate('/note');
    setTimeout(() => {
      sessionStorage.setItem('companion_quick_note', quickNote.trim());
      window.dispatchEvent(new Event('companion-quick-note'));
    }, 100);
    setQuickNote('');
    setShowQuickNote(false);
  }

  function triggerPulse(key: string) {
    setPulse(key);
    setTimeout(() => setPulse(p => (p === key ? null : p)), 450);
  }

  // Clickable widget handlers
  function addWater() {
    const today = todayStr();
    const current = water.date === today ? water.count : 0;
    const next = current + waterClick;
    setWater(prev => ({ ...prev, date: today, count: next }));
    triggerPulse('water');
    if (next >= waterGoal) markComplete('water');
    toast(`💧 +${waterClick} ${t('cup')}! (${formatWaterCount(next, waterUnit)}/${formatWaterGoal(waterGoal, waterUnit)})`, { duration: 2000 });
  }

  function addMeds() {
    const today = todayStr();
    const h = new Date().getHours();
    if (h < 12) {
      setMeds(prev => ({ ...prev, date: today, morning: true }));
      toast(`💊 ${t('morning_dose_marked')}`, { duration: 2000 });
    } else if (h < 17) {
      setMeds(prev => ({ ...prev, date: today, afternoon: true }));
      toast(`💊 ${t('afternoon_dose_marked')}`, { duration: 2000 });
    } else {
      setMeds(prev => ({ ...prev, date: today, evening: true }));
      toast(`💊 ${t('evening_dose_marked')}`, { duration: 2000 });
    }
    triggerPulse('meds');
    markComplete('meds');
  }

  function waterPlants() {
    if (plants.length === 0) { navigate('/tracker'); return; }
    const nowIso = new Date().toISOString();
    setPlants(prev => prev.map(p => ({ ...p, lastWatered: nowIso })));
    triggerPulse('plant');
    markComplete('plant');
    toast(`🌿 ${t('all_plants_watered')}`, { duration: 2000 });
  }

  function setUnit(u: 'cups' | 'ml' | 'L') {
    if (!isPro) { showProPopup(); return; }
    setWater(prev => ({ ...prev, unit: u }));
  }

  function handleCustomize() {
    if (!isPro) { showProPopup(); return; }
    setShowCustomize(true);
  }

  // ---- Section render map ----
  const sections: Record<HomeSection, () => ReactElement | null> = {
    whatToDoToday: () => <WhatToDoToday key="whatToDoToday" />,

    noteBanner: () => (
      <div
        key="noteBanner"
        className="rounded-xl border border-dashed border-[var(--brand-primary)] bg-[hsl(150_30%_98%)] cursor-pointer transition-all"
        onClick={() => setShowQuickNote(v => !v)}
      >
        {!showQuickNote ? (
          <div className="flex items-center gap-2 px-4 py-3">
            <span className="text-base">✏️</span>
            <p className="text-sm text-[hsl(150_20%_35%)] font-medium flex-1">{t('quick_note_banner')}</p>
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
        ) : (
          <div className="p-3 space-y-2" onClick={e => e.stopPropagation()}>
            <textarea
              autoFocus
              value={quickNote}
              onChange={e => setQuickNote(e.target.value)}
              placeholder={t('quick_note_placeholder')}
              rows={2}
              className="w-full text-sm text-foreground bg-transparent placeholder:text-muted-foreground resize-none outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleQuickNote();
                if (e.key === 'Escape') setShowQuickNote(false);
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleQuickNote} disabled={!quickNote.trim()} className="h-7 text-xs bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0">
                {t('got_it')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowQuickNote(false)} className="h-7 text-xs">
                {t('cancel')}
              </Button>
              <Link href="/note" className="ms-auto text-xs text-[hsl(150_25%_40%)] self-center flex items-center gap-0.5">
                {t('tab_note')} <ChevronRight size={11} />
              </Link>
            </div>
          </div>
        )}
      </div>
    ),

    mood: () => (
      <Card key="mood" className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <MoodSelector customQuestion={moodQuestion(lang)} />
        </CardContent>
      </Card>
    ),

    parking: () => (
      <Card key="parking" className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <MapPin size={14} className="text-[var(--brand-accent)]" />
              {t('last_parked')}
            </p>
            <Link href="/tracker" className="text-xs text-[hsl(150_25%_40%)] flex items-center gap-0.5">
              {t('tab_tracker')} <ChevronRight size={12} />
            </Link>
          </div>
          {parking ? (
            <div>
              <p className="text-sm text-foreground font-medium">{displayAddress}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(parking.timestamp)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('no_parking')}{' '}
              <Link href="/tracker" className="text-[hsl(150_25%_40%)] underline underline-offset-2">
                {t('no_parking_link')}
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    ),

    upcomingEvents: () => (
      upcoming.length > 0 ? (
        <Card key="upcomingEvents" className="border-[hsl(35_25%_88%)] shadow-sm cursor-pointer hover:border-[var(--brand-secondary)] transition-all" onClick={() => navigate('/timeline')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">{t('coming_up')}</p>
              <span className="text-xs text-[hsl(220_40%_55%)] flex items-center gap-0.5">{t('view_all')} <ChevronRight size={12} /></span>
            </div>
            <div className="space-y-2">
              {upcoming.map(event => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="mt-0.5 text-sm">
                    {event.type === 'appointment' ? '📅' : event.type === 'plant' ? '🌿' : event.type === 'recurring' ? '💊' : '⏰'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.datetime ? `${formatTime(event.datetime)} · ${timeUntil(event.datetime)}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card key="upcomingEvents" className="border-dashed border-[hsl(35_25%_88%)] bg-[hsl(40_30%_98%)] shadow-none">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">{t('no_events')}</p>
            <Link href="/note" className="text-sm text-[hsl(150_25%_40%)] underline underline-offset-2 mt-1 inline-block">
              {t('add_with_note')}
            </Link>
          </CardContent>
        </Card>
      )
    ),

    statsStrip: () => (
      <div key="statsStrip" className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 min-w-max pb-1">
          {/* Water — clickable + config */}
          <div className="w-48 shrink-0 relative">
            <button
              onClick={addWater}
              className="w-full p-3 rounded-xl border border-[hsl(35_25%_88%)] bg-white text-left active:scale-95 transition-all hover:border-[var(--brand-secondary)] hover:bg-[hsl(220_50%_98%)] group"
              title={t('tap_add_water')}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">{t('water_today')} <StreakBadge category="water" emoji="💧" /></p>
                <Droplets size={13} className="text-[hsl(210_60%_65%)] group-hover:text-[hsl(210_60%_50%)] transition-colors" />
              </div>
              <p className={cn('text-xl font-bold text-[hsl(210_60%_55%)] transition-transform', pulse === 'water' && 'scale-110')}>
                {formatWaterCount(waterCount, waterUnit)}
                <span className="text-sm font-normal text-muted-foreground">/{formatWaterGoal(waterGoal, waterUnit)}</span>
              </p>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: Math.min(waterGoal, 10) }, (_, i) => (
                  <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all duration-500', i < waterCount ? 'bg-[#9DBEF0]' : 'bg-[hsl(35_20%_90%)]')} />
                ))}
              </div>
            </button>
            <button
              onClick={() => setShowWaterConfig(v => !v)}
              className="absolute bottom-2 right-2 text-muted-foreground/60 hover:text-foreground p-1"
              aria-label={t('water_settings')}
            >
              <Settings2 size={12} />
            </button>
            {showWaterConfig && (
              <div className="absolute z-20 top-full mt-1 left-0 w-56 p-3 rounded-xl border border-[hsl(35_25%_88%)] bg-white shadow-lg space-y-2" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{t('daily_target')}</span>
                  <Input
                    type="number" min={1} max={20} value={waterGoal}
                    onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= 20) setWater(prev => ({ ...prev, goal: v })); }}
                    className="h-7 w-16 text-xs"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">{t('per_tap')}</span>
                  <Input
                    type="number" min={1} max={10} value={waterClick}
                    onChange={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= 10) setWater(prev => ({ ...prev, clickAmount: v })); }}
                    className="h-7 w-16 text-xs"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">{t('unit')}</span>
                  <div className="flex gap-1 mt-1">
                    {WATER_UNITS.map(u => (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={cn('flex-1 py-1 rounded-lg text-[11px] font-medium border transition-all', waterUnit === u ? 'border-[var(--brand-secondary)] bg-[var(--brand-secondary)] text-[hsl(220_30%_35%)]' : 'border-[hsl(35_25%_88%)] text-muted-foreground')}
                      >
                        {u}{!isPro && u !== 'cups' && ' 🔒'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Meds — clickable */}
          <button
            onClick={addMeds}
            disabled={allMedsDone}
            className={cn(
              'w-40 shrink-0 p-3 rounded-xl border bg-white text-left transition-all active:scale-95',
              allMedsDone ? 'border-[var(--brand-primary)] cursor-default' : 'border-[hsl(35_25%_88%)] hover:border-[var(--brand-primary)] hover:bg-[hsl(150_30%_98%)] group'
            )}
            title={t('tap_add_meds')}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">{t('meds_today')} <StreakBadge category="meds" emoji="🔥" /></p>
              <Pill size={13} className="text-muted-foreground" />
            </div>
            <p className={cn('text-xl font-bold transition-transform', allMedsDone ? 'text-[var(--brand-accent)]' : 'text-foreground', pulse === 'meds' && 'scale-110')}>
              {allMedsDone ? t('meds_done') : t('meds_not_yet')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('morning')} · {t('afternoon')} · {t('evening')}</p>
          </button>

          {/* Plant — clickable */}
          {nextPlant && (
            <button
              onClick={waterPlants}
              className="w-44 shrink-0 p-3 rounded-xl border border-[hsl(35_25%_88%)] bg-white text-left active:scale-95 transition-all hover:border-[var(--brand-primary)] hover:bg-[hsl(150_30%_98%)] group"
              title={t('tap_water_plant')}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">{t('next_plant_care')} <StreakBadge category="plant" emoji="🌿" /></p>
                <span className={cn('text-sm transition-transform', pulse === 'plant' && 'scale-125')}>🌿</span>
              </div>
              <p className="text-sm font-bold text-foreground truncate">{nextPlant.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {nextPlant.daysUntil <= 0 ? t('due_today') : `${t('in_label')} ${nextPlant.daysUntil}${t('days_short')}`}
              </p>
            </button>
          )}
        </div>
      </div>
    ),

    quickTimer: () => (
      <Card key="quickTimer" className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Timer size={14} className="text-[var(--brand-accent)]" />
              {t('quick_timers')}
            </p>
            <Link href="/timeline" className="text-xs text-[hsl(150_25%_40%)] flex items-center gap-0.5">
              {t('all_timers')} <ChevronRight size={12} />
            </Link>
          </div>

          {!hasPrioritized && (
            <div className="flex gap-2 mb-3">
              {QUICK_TIMERS.map(preset => (
                <Button key={preset.label} variant="outline" size="sm" onClick={() => startTimer(preset.label, preset.durationMs)} className="flex-1 h-10 text-xs border-[hsl(35_25%_88%)] bg-[hsl(40_30%_98%)] hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)]">
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          {hasPrioritized && (
            <div className="mb-3 p-3 rounded-xl bg-[hsl(220_50%_15%)] border border-[hsl(220_40%_30%)]">
              <p className="text-[10px] font-semibold text-[hsl(220_70%_80%)] mb-2 flex items-center gap-1">
                <Star size={9} fill="currentColor" /> {t('pinned_home')}
              </p>
              <div className="space-y-2">
                {prioritizedTimers.map(timer => (
                  <TimerCard key={timer.id} timer={timer} displayTime={getDisplayTime(timer)} progress={getProgress(timer)} onPause={pauseTimer} onResume={resumeTimer} onCancel={cancelTimer} onDismiss={dismissCompleted} onTogglePrioritize={togglePrioritize} canPrioritize={canPrioritize} showPrioritizeButton dark />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {[...activeUnpinned.slice(0, 2), ...completedTimers.slice(0, 1)].map(timer => (
              <TimerCard key={timer.id} timer={timer} displayTime={getDisplayTime(timer)} progress={getProgress(timer)} onPause={pauseTimer} onResume={resumeTimer} onCancel={cancelTimer} onDismiss={dismissCompleted} />
            ))}
            {hasPrioritized && activeUnpinned.length === 0 && completedTimers.length === 0 && (
              <div className="flex gap-2">
                {QUICK_TIMERS.map(preset => (
                  <Button key={preset.label} variant="outline" size="sm" onClick={() => startTimer(preset.label, preset.durationMs)} className="flex-1 h-9 text-xs border-[hsl(35_25%_88%)] bg-[hsl(40_30%_98%)] hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)]">
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ),

    healthSummary: () => (
      <Card key="healthSummary" className="border-[hsl(35_25%_88%)] shadow-sm cursor-pointer hover:border-[hsl(340_50%_85%)] transition-all" onClick={() => navigate('/health')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Heart size={14} className="text-[hsl(340_50%_60%)]" />
              {t('health_summary')}
            </p>
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
          <div className="flex gap-2 mt-2">
            <StreakBadge category="steps" emoji="👟" />
            <StreakBadge category="sleep" emoji="😴" />
            <span className="text-xs text-muted-foreground">{t('view_health')}</span>
          </div>
        </CardContent>
      </Card>
    ),

    periodTracker: () => (
      <Card key="periodTracker" className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <PeriodTracker />
        </CardContent>
      </Card>
    ),

    recentNotes: () => (
      <Card key="recentNotes" className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <StickyNote size={14} className="text-[var(--brand-accent)]" />
              {t('recent_notes')}
            </p>
            <Link href="/note" className="text-xs text-[hsl(150_25%_40%)] flex items-center gap-0.5">{t('tab_note')} <ChevronRight size={12} /></Link>
          </div>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('no_notes_yet')}</p>
          ) : (
            <div className="space-y-1.5">
              {recentNotes.map(n => (
                <Link key={n.id} href="/note" className="block p-2 rounded-lg bg-[hsl(40_20%_98%)] hover:bg-[hsl(150_30%_96%)]">
                  <p className="text-sm font-medium text-foreground truncate">{n.starred ? '📌 ' : ''}{n.title || t('untitled_note')}</p>
                  {n.content && <p className="text-xs text-muted-foreground truncate">{n.content}</p>}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    ),
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between pr-16">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{greeting}</h1>
          {isBirthday && (
            <p className="text-sm text-[hsl(340_50%_55%)] mt-0.5 font-medium">🎉 {t('special_day')}</p>
          )}
          {!isBirthday && (
            <p className="text-sm text-muted-foreground mt-0.5">{t('tagline')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isPro && (
            <span className="text-[10px] font-semibold text-white bg-gradient-to-r from-[hsl(220_40%_55%)] to-[var(--brand-accent)] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} /> {proLabel(lang)}
            </span>
          )}
          {isSignedIn ? (
            <button onClick={() => signOut()} className="w-8 h-8 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] transition-colors overflow-hidden" title={t('sign_out')}>
              {user?.imageUrl ? <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" /> : <User size={16} />}
            </button>
          ) : (
            <Link href="/sign-in" className="text-xs text-[hsl(150_25%_40%)] border border-[var(--brand-primary)] px-2.5 py-1 rounded-full hover:bg-[var(--brand-primary)] transition-colors">
              {t('sign_in')}
            </Link>
          )}
        </div>
      </div>

      {/* Pro customize button */}
      {isSignedIn && (
        <button
          onClick={handleCustomize}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all',
            isPro
              ? 'border-[hsl(220_40%_70%)] text-[hsl(220_40%_45%)] bg-[hsl(220_60%_97%)] hover:bg-[var(--brand-secondary)]'
              : 'border-[hsl(35_25%_88%)] text-muted-foreground/50 bg-[hsl(40_20%_97%)] cursor-not-allowed'
          )}
        >
          <Settings2 size={11} />
          {isPro ? t('customize_home') : t('customize_home_pro')}
          {!isPro && <span className="text-[9px] text-[hsl(220_40%_55%)] font-bold ml-0.5">Pro</span>}
        </button>
      )}

      {/* Config-driven sections */}
      {config.order.filter(isVisible).map(section => sections[section]())}

      {/* Customize sheet */}
      <HomeCustomizeSheet open={showCustomize} onClose={() => setShowCustomize(false)} />

      {/* Profile setup modal */}
      {showProfileSetup && (
        <ProfileSetupModal onClose={() => setShowProfileSetup(false)} />
      )}

      {/* Birthday Pro Expired popup */}
      {showBirthdayExpiredPopup && !birthdayExpiredDismissed && (
        <div className="fixed inset-0 z-[180] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-[480px] bg-[var(--brand-surface)] rounded-t-3xl p-6 pb-10 text-center shadow-2xl">
            <p className="text-3xl mb-3">👑</p>
            <p className="text-base font-bold text-foreground mb-1">{t('birthday_pro_expired')}</p>
            <p className="text-sm text-muted-foreground mb-5">{t('birthday_pro_expired_sub')}</p>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-gradient-to-r from-[hsl(220_40%_55%)] to-[var(--brand-accent)] text-white border-0 font-semibold"
                onClick={() => {
                  setShowBirthdayExpiredPopup(false);
                  setBirthdayExpiredDismissed(true);
                  toast(t('pro_coming_soon'), { duration: 3000 });
                }}
              >
                {profile.gender === 'male' ? t('become_king_pro') : profile.gender === 'female' ? t('become_queen_pro') : t('become_cool_pro')}
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setShowBirthdayExpiredPopup(false);
                  setBirthdayExpiredDismissed(true);
                }}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
