import { useState } from 'react';
import ProGate from '@/components/ProGate';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLongPress } from '@/hooks/useLongPress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useIsPro } from '@/components/ProGate';
import PermissionsModal from '@/components/PermissionsModal';
import PeriodTracker from '@/components/PeriodTracker';
import {
  Heart, Footprints, Flame, Moon, Activity, ChevronDown, ChevronUp,
  Zap, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthData {
  steps: number;
  heartRate: number;
  calories: number;
  sleepHours: number;
  lastUpdated: number;
}

interface ConnectedApps {
  appleHealth: boolean;
  googleFit: boolean;
  fitbit: boolean;
  samsungHealth: boolean;
  appleWatch: boolean;
}

interface HistoryEntry {
  date: string;
  steps?: number;
  heartRate?: number;
  calories?: number;
  sleepHours?: number;
}

const SYNC_APPS = [
  { key: 'appleHealth' as const, name: 'Apple Health', color: 'hsl(0 70% 55%)' },
  { key: 'googleFit' as const, name: 'Google Fit', color: 'hsl(150 50% 45%)' },
  { key: 'fitbit' as const, name: 'Fitbit', color: 'hsl(210 70% 50%)' },
  { key: 'samsungHealth' as const, name: 'Samsung Health', color: 'hsl(220 60% 50%)' },
  { key: 'appleWatch' as const, name: 'Apple Watch', color: 'hsl(0 0% 20%)' },
];

function CollapsibleSection({ title, icon, defaultOpen = true, children, badge }: {
  title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-[hsl(35_25%_88%)] shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-[hsl(40_20%_97%)] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {badge && (
            <span className="text-[10px] font-medium text-[var(--brand-accent)] bg-[var(--brand-primary)] px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-muted-foreground shrink-0" /> : <ChevronDown size={15} className="text-muted-foreground shrink-0" />}
      </button>
      {open && <CardContent className="pt-0 px-4 pb-4">{children}</CardContent>}
    </Card>
  );
}

function HistoryPopover({ title, icon, history, field, unit, onClose }: {
  title: string; icon: React.ReactNode; history: HistoryEntry[];
  field: keyof Omit<HistoryEntry, 'date'>; unit: string; onClose: () => void;
}) {
  const entries = history.filter(h => h[field] !== undefined).slice(0, 7);
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.3)' }} onClick={onClose}>
      <div className="w-full max-w-[480px] bg-[var(--brand-surface)] rounded-t-2xl p-5 pb-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">{icon}<p className="text-base font-bold text-foreground">{title} History</p></div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
        </div>
        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[hsl(35_25%_90%)] last:border-0">
                <p className="text-sm text-muted-foreground">{entry.date}</p>
                <p className="text-sm font-semibold text-foreground">
                  {field === 'sleepHours' ? `${entry[field]}h` : `${(entry[field] as number)?.toLocaleString()} ${unit}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No history yet — connect a health app to see data over time!</p>
        )}
      </div>
    </div>
  );
}

function HealthContent() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const isPro = useIsPro();

  const [health, setHealth] = useLocalStorage<HealthData>('companion_health', {
    steps: 4280, heartRate: 72, calories: 1420, sleepHours: 7.2, lastUpdated: Date.now() - 600000,
  });
  const [connected, setConnected] = useLocalStorage<ConnectedApps>('companion_connected_apps', {
    appleHealth: false, googleFit: false, fitbit: false, samsungHealth: false, appleWatch: false,
  });
  const [history] = useLocalStorage<HistoryEntry[]>('companion_health_history', [
    { date: 'Yesterday', steps: 8420, heartRate: 68, calories: 1680, sleepHours: 6.8 },
    { date: '2 days ago', steps: 5600, heartRate: 74, calories: 1540, sleepHours: 7.5 },
    { date: '3 days ago', steps: 11200, heartRate: 70, calories: 1920, sleepHours: 8.1 },
    { date: '4 days ago', steps: 3900, heartRate: 76, calories: 1350, sleepHours: 5.9 },
    { date: '5 days ago', steps: 7800, heartRate: 71, calories: 1610, sleepHours: 7.2 },
  ]);

  const [syncing, setSyncing] = useState<string | null>(null);
  const [permModal, setPermModal] = useState<typeof SYNC_APPS[0] | null>(null);
  const [pendingConnect, setPendingConnect] = useState<typeof SYNC_APPS[0] | null>(null);
  const [historyPopover, setHistoryPopover] = useState<{ field: keyof Omit<HistoryEntry, 'date'>; title: string; unit: string; icon: React.ReactNode } | null>(null);

  const showPeriodTracker = profile.gender === 'female' || isPro;

  function requestConnect(app: typeof SYNC_APPS[0]) {
    setPendingConnect(app);
    setPermModal(app);
  }

  function confirmConnect() {
    if (!pendingConnect) return;
    setPermModal(null);
    setSyncing(pendingConnect.key);
    setTimeout(() => {
      setConnected(prev => ({ ...prev, [pendingConnect.key]: true }));
      setHealth(prev => ({
        ...prev,
        steps: Math.floor(3000 + Math.random() * 7000),
        heartRate: Math.floor(60 + Math.random() * 30),
        calories: Math.floor(1200 + Math.random() * 800),
        sleepHours: Math.round((6 + Math.random() * 3) * 10) / 10,
        lastUpdated: Date.now(),
      }));
      setSyncing(null);
      setPendingConnect(null);
    }, 1200);
  }

  function disconnect(key: keyof ConnectedApps) {
    setConnected(prev => ({ ...prev, [key]: false }));
  }

  const anyConnected = Object.values(connected).some(Boolean);
  const stepGoal = 10000;
  const stepPercent = Math.min(100, (health.steps / stepGoal) * 100);
  const calorieGoal = 2000;
  const calPercent = Math.min(100, (health.calories / calorieGoal) * 100);

  const hrStatus = health.heartRate < 60
    ? { label: t('heart_low'), color: 'text-[hsl(210_70%_55%)]' }
    : health.heartRate <= 100
    ? { label: t('heart_healthy'), color: 'text-[var(--brand-accent)]' }
    : { label: t('heart_elevated'), color: 'text-[hsl(30_80%_50%)]' };

  const slStatus = health.sleepHours < 6
    ? { label: t('sleep_low'), color: 'text-[hsl(30_80%_50%)]' }
    : health.sleepHours <= 9
    ? { label: t('sleep_great'), color: 'text-[var(--brand-accent)]' }
    : { label: 'Long sleep', color: 'text-muted-foreground' };

  const stepsLP = useLongPress({ delay: 500, onLongPress: () => setHistoryPopover({ field: 'steps', title: t('steps'), unit: 'steps', icon: <Footprints size={16} className="text-[var(--brand-accent)]" /> }) });
  const heartLP = useLongPress({ delay: 500, onLongPress: () => setHistoryPopover({ field: 'heartRate', title: t('heart_rate'), unit: 'bpm', icon: <Heart size={16} className="text-red-400" /> }) });
  const calLP = useLongPress({ delay: 500, onLongPress: () => setHistoryPopover({ field: 'calories', title: t('calories'), unit: 'kcal', icon: <Flame size={16} className="text-orange-400" /> }) });
  const sleepLP = useLongPress({ delay: 500, onLongPress: () => setHistoryPopover({ field: 'sleepHours', title: t('sleep'), unit: '', icon: <Moon size={16} className="text-[hsl(220_40%_65%)]" /> }) });

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <div className="flex items-start justify-between pr-16">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('health_title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('health_subtitle')}</p>
        </div>
        {anyConnected && (
          <span className="text-[10px] font-medium text-[var(--brand-accent)] bg-[var(--brand-primary)] px-2 py-0.5 rounded-full mt-1">{t('live')}</span>
        )}
      </div>

      {!anyConnected && (
        <div className="p-4 rounded-xl bg-[hsl(220_50%_97%)] border border-[var(--brand-secondary)] text-center">
          <p className="text-sm font-semibold text-foreground mb-1">{t('connect_apps')}</p>
          <p className="text-xs text-muted-foreground">{t('connect_apps_desc')}</p>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">💡 Long-press any card to see your history</p>

      {/* Period Tracker — female or Pro */}
      {showPeriodTracker && (
        <CollapsibleSection
          title={t('period_tracker')}
          icon={<Heart size={14} className="text-[hsl(340_50%_65%)]" fill="hsl(340,50%,65%)" />}
          badge={profile.gender === 'female' ? undefined : 'Pro'}
          defaultOpen={profile.gender === 'female'}
        >
          <p className="text-xs text-muted-foreground mb-3">{t('period_tracker_subtitle')}</p>
          <PeriodTracker />
        </CollapsibleSection>
      )}

      {/* Today's Stats */}
      <CollapsibleSection
        title="Today's Stats"
        icon={<Activity size={14} className="text-[var(--brand-accent)]" />}
        badge={anyConnected ? 'Live' : undefined}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Steps */}
          <div {...stepsLP} className="p-3 rounded-xl bg-[hsl(40_20%_98%)] border border-[hsl(35_25%_90%)] cursor-pointer active:scale-95 transition-transform select-none">
            <div className="flex items-center gap-2 mb-1">
              <Footprints size={15} className="text-[var(--brand-accent)]" />
              <p className="text-xs font-semibold text-muted-foreground">{t('steps')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{health.steps.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mb-2">{t('goal')}: {stepGoal.toLocaleString()}</p>
            <div className="h-1.5 bg-[hsl(35_20%_90%)] rounded-full overflow-hidden">
              <div className="h-full bg-[hsl(150_40%_60%)] rounded-full transition-all" style={{ width: `${stepPercent}%` }} />
            </div>
            {health.steps >= stepGoal && <p className="text-[10px] text-[var(--brand-accent)] mt-1 font-medium">{t('goal_reached')}</p>}
          </div>

          {/* Heart rate */}
          <div {...heartLP} className="p-3 rounded-xl bg-[hsl(40_20%_98%)] border border-[hsl(35_25%_90%)] cursor-pointer active:scale-95 transition-transform select-none">
            <div className="flex items-center gap-2 mb-1">
              <Heart size={15} className="text-red-400" />
              <p className="text-xs font-semibold text-muted-foreground">{t('heart_rate')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{health.heartRate} <span className="text-sm font-normal">bpm</span></p>
            <p className={cn('text-xs font-medium mt-1', hrStatus.color)}>{hrStatus.label}</p>
            <div className="mt-2 flex gap-0.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={cn('flex-1 rounded-full transition-all', i < Math.round(health.heartRate / 15) ? health.heartRate > 100 ? 'bg-orange-300 h-4' : 'bg-red-300 h-4' : 'bg-[hsl(35_20%_90%)] h-2 mt-1')} />
              ))}
            </div>
          </div>

          {/* Calories */}
          <div {...calLP} className="p-3 rounded-xl bg-[hsl(40_20%_98%)] border border-[hsl(35_25%_90%)] cursor-pointer active:scale-95 transition-transform select-none">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={15} className="text-orange-400" />
              <p className="text-xs font-semibold text-muted-foreground">{t('calories')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{health.calories.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground mb-2">{t('goal')}: {calorieGoal.toLocaleString()} kcal</p>
            <div className="h-1.5 bg-[hsl(35_20%_90%)] rounded-full overflow-hidden">
              <div className="h-full bg-orange-300 rounded-full transition-all" style={{ width: `${calPercent}%` }} />
            </div>
          </div>

          {/* Sleep */}
          <div {...sleepLP} className="p-3 rounded-xl bg-[hsl(40_20%_98%)] border border-[hsl(35_25%_90%)] cursor-pointer active:scale-95 transition-transform select-none">
            <div className="flex items-center gap-2 mb-1">
              <Moon size={15} className="text-[hsl(220_40%_65%)]" />
              <p className="text-xs font-semibold text-muted-foreground">{t('sleep')}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{health.sleepHours}h</p>
            <p className={cn('text-xs font-medium mt-1', slStatus.color)}>{slStatus.label}</p>
            <div className="mt-2 flex gap-0.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={cn('flex-1 h-3 rounded-full', i < Math.floor(health.sleepHours) ? 'bg-[var(--brand-secondary)]' : 'bg-[hsl(35_20%_90%)]')} />
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Activity suggestion */}
      <CollapsibleSection title={t('activity_suggestion')} icon={<Activity size={14} className="text-[var(--brand-accent)]" />}>
        {health.steps < 5000
          ? <p className="text-sm text-muted-foreground">You've been a bit still today — even a <strong className="text-foreground">10-minute walk</strong> can boost your mood and focus! 🚶</p>
          : health.steps < stepGoal
          ? <p className="text-sm text-muted-foreground">Great job! Only <strong className="text-foreground">{(stepGoal - health.steps).toLocaleString()} more steps</strong> to hit your goal! 💪</p>
          : <p className="text-sm text-muted-foreground">Incredible — you've hit your step goal! Take a well-deserved rest or keep going. 🎉</p>
        }
      </CollapsibleSection>

      {/* Health Apps */}
      <CollapsibleSection title={t('health_apps')} icon={<Zap size={14} className="text-[var(--brand-accent)]" />} defaultOpen={!anyConnected}>
        <p className="text-xs text-muted-foreground mb-3">{t('health_apps_desc')}</p>
        <div className="space-y-2">
          {SYNC_APPS.map(app => (
            <div key={app.key} className="flex items-center justify-between p-2.5 rounded-xl border border-[hsl(35_25%_90%)] bg-[hsl(40_20%_98%)]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: app.color }} />
                <p className="text-sm font-medium text-foreground">{app.name}</p>
              </div>
              {connected[app.key] ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--brand-accent)] font-medium">{t('connected')}</span>
                  <button onClick={() => disconnect(app.key)} className="text-muted-foreground hover:text-red-400 transition-colors" title="Disconnect"><X size={13} /></button>
                </div>
              ) : (
                <Button size="sm" onClick={() => requestConnect(app)} disabled={syncing === app.key}
                  className="h-7 text-xs rounded-full px-3 border-0 bg-[hsl(40_20%_90%)] text-foreground hover:bg-[var(--brand-primary)]">
                  {syncing === app.key ? t('syncing') : t('connect')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {historyPopover && (
        <HistoryPopover title={historyPopover.title} icon={historyPopover.icon} history={history}
          field={historyPopover.field} unit={historyPopover.unit} onClose={() => setHistoryPopover(null)} />
      )}

      {permModal && (
        <PermissionsModal isOpen={true}
          onClose={() => { setPermModal(null); setPendingConnect(null); }}
          onAllow={confirmConnect}
          serviceName={permModal.name}
          serviceIcon="💪"
          permissions={[
            `Read daily health stats from ${permModal.name}`,
            'Sync steps, heart rate, calories, and sleep data',
            'Never share your health data with third parties',
            'You can disconnect at any time',
          ]}
          description={`Connecting to ${permModal.name} will allow Companion to read your health data. Your data stays on your device.`}
        />
      )}
    </div>
  );
}

export default function Health() {
  return (
    <ProGate feature="the Health dashboard and app sync">
      <HealthContent />
    </ProGate>
  );
}
