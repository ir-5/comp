import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStreaks } from '@/hooks/useStreaks';
import { cn, todayStr, uid } from '@/lib/utils';
import { todayKey, SLOT_DEFAULT_TIME, Medicine, MedTracking, MedSlot } from '@/lib/companionTypes';
import { Pill, Plus, X, ChevronDown, ChevronUp, Pencil, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useIsPro } from '@/components/ProGate';
import { useProPopup } from '@/components/ProPopup';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const FREE_MED_LIMIT = 3;
const PRO_MED_LIMIT = 10;

const SLOT_META: { key: MedSlot; label: string; emoji: string }[] = [
  { key: 'morning', label: 'Morning', emoji: '🌅' },
  { key: 'afternoon', label: 'Afternoon', emoji: '☀️' },
  { key: 'evening', label: 'Evening', emoji: '🌙' },
];

function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

interface DoseEntry {
  med: Medicine;
  slot: MedSlot;
  time: string;
  taken: boolean;
}

export default function MedChecklist() {
  const isPro = useIsPro();
  const { showProPopup } = useProPopup();
  const { t } = useLanguage();
  const { markComplete, undoComplete } = useStreaks();
  const [medicines, setMedicines] = useLocalStorage<Medicine[]>('companion_meds_list', []);
  const [tracking, setTracking] = useLocalStorage<MedTracking>('companion_meds_tracking', {});
  const [, setLegacyMeds] = useLocalStorage('companion_meds', { date: todayStr(), morning: false, afternoon: false, evening: false, medName: '' });

  const [collapsed, setCollapsed] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [slots, setSlots] = useState<MedSlot[]>(['morning']);
  const [times, setTimes] = useState<Partial<Record<MedSlot, string>>>({});

  const today = todayKey();
  const limit = isPro ? PRO_MED_LIMIT : FREE_MED_LIMIT;

  const doses: DoseEntry[] = medicines
    .flatMap(med =>
      med.slots.map(slot => ({
        med,
        slot,
        time: med.times?.[slot] ?? SLOT_DEFAULT_TIME[slot],
        taken: !!tracking[today]?.[med.id]?.[slot],
      })),
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const takenCount = doses.filter(d => d.taken).length;

  function syncLegacy(next: MedTracking) {
    const all = Object.values(next[today] ?? {});
    setLegacyMeds({
      date: todayStr(),
      morning: all.some(m => m.morning),
      afternoon: all.some(m => m.afternoon),
      evening: all.some(m => m.evening),
      medName: medicines[0]?.name ?? '',
    });
  }

  function toggle(medId: string, slot: MedSlot) {
    setTracking(prev => {
      const day = prev[today] ?? {};
      const med = day[medId] ?? {};
      const nowTaken = !med[slot];
      const next = { ...prev, [today]: { ...day, [medId]: { ...med, [slot]: nowTaken } } };
      syncLegacy(next);
      if (nowTaken) markComplete('meds');
      else undoComplete('meds');
      return next;
    });
  }

  function resetForm() {
    setName('');
    setDose('');
    setSlots(['morning']);
    setTimes({});
    setShowAdd(false);
    setEditingId(null);
  }

  function startEdit(med: Medicine) {
    setEditingId(med.id);
    setName(med.name);
    setDose(med.dose ?? '');
    setSlots(med.slots);
    setTimes(med.times ?? {});
    setShowAdd(true);
  }

  function toggleSlot(slot: MedSlot) {
    setSlots(prev => (prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]));
  }

  function save() {
    if (!name.trim() || slots.length === 0) return;
    if (!editingId && medicines.length >= limit) {
      if (!isPro) showProPopup();
      else toast(t('med_limit_reached'), { duration: 2500 });
      return;
    }
    const filledTimes: Partial<Record<MedSlot, string>> = {};
    slots.forEach(s => { filledTimes[s] = times[s] ?? SLOT_DEFAULT_TIME[s]; });

    if (editingId) {
      setMedicines(prev => prev.map(m => (m.id === editingId ? { ...m, name: name.trim(), dose: dose.trim() || undefined, slots, times: filledTimes } : m)));
      toast(`💊 ${name.trim()} ${t('med_updated')}`, { duration: 2000 });
    } else {
      setMedicines(prev => [...prev, { id: uid(), name: name.trim(), dose: dose.trim() || undefined, slots, times: filledTimes, schedule: 'daily' }]);
      toast(`💊 ${name.trim()} ${t('med_added')}`, { duration: 2000 });
    }
    resetForm();
  }

  function removeMed(id: string) {
    setMedicines(prev => prev.filter(m => m.id !== id));
  }

  if (medicines.length === 0 && !showAdd) {
    return (
      <div data-testid="med-checklist-empty" className="text-center py-2">
        <Pill size={20} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">{t('no_meds')}</p>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} data-testid="btn-add-med" className="gap-1">
          <Plus size={14} /> {t('add_medication')}
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="med-checklist" className="space-y-3">
      {/* Collapsible header */}
      {medicines.length > 0 && (
        <button
          onClick={() => setCollapsed(c => !c)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-xs text-muted-foreground">
            {takenCount}/{doses.length} {t('doses_taken')}
          </span>
          {collapsed ? <ChevronDown size={15} className="text-muted-foreground" /> : <ChevronUp size={15} className="text-muted-foreground" />}
        </button>
      )}

      {!collapsed && (
        <div className="space-y-2">
          {doses.map(({ med, slot, time, taken }) => {
            const meta = SLOT_META.find(s => s.key === slot)!;
            return (
              <div
                key={`${med.id}:${slot}`}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl border transition-all',
                  taken ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/30 opacity-70' : 'border-[hsl(35_25%_88%)] bg-white',
                )}
              >
                <button
                  onClick={() => toggle(med.id, slot)}
                  className={cn(
                    'shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90',
                    taken ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white' : 'border-[hsl(35_25%_80%)] text-transparent hover:border-[hsl(150_30%_55%)]',
                  )}
                  aria-label={taken ? t('taken') : t('not_taken')}
                >
                  <Check size={15} strokeWidth={3} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold leading-tight', taken ? 'line-through text-muted-foreground' : 'text-foreground')}>
                    <span className="text-[hsl(220_40%_55%)] font-bold">{fmtTime(time)}</span> — {med.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {meta.emoji} {t(`slot_${slot}`)}{med.dose ? ` · ${med.dose}` : ''}
                  </p>
                </div>
                <button onClick={() => startEdit(med)} className="text-muted-foreground hover:text-foreground p-1 shrink-0 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => removeMed(med.id)} className="text-muted-foreground hover:text-red-400 p-1 shrink-0 transition-colors">
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit form */}
      {showAdd ? (
        <div className="p-3 rounded-xl border border-[hsl(35_25%_88%)] bg-[hsl(40_20%_98%)] space-y-2">
          <p className="text-xs font-semibold text-foreground">{editingId ? t('edit_medicine') : t('add_medicine')}</p>
          <Input
            placeholder={t('medicine_name')}
            value={name}
            onChange={e => setName(e.target.value)}
            className="h-8 text-sm"
            autoFocus
            data-testid="input-med-name"
          />
          <Input
            placeholder={isPro ? t('dose_placeholder') : t('dose_placeholder_free')}
            value={dose}
            onChange={e => isPro ? setDose(e.target.value) : showProPopup()}
            readOnly={!isPro}
            onClick={() => { if (!isPro) showProPopup(); }}
            className={cn('h-8 text-sm', !isPro && 'opacity-50 cursor-not-allowed')}
          />
          <div className="space-y-1.5">
            {SLOT_META.map(s => {
              const active = slots.includes(s.key);
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSlot(s.key)}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all text-left px-2',
                      active ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-accent-deep)]' : 'border-[hsl(35_25%_88%)] text-muted-foreground',
                    )}
                  >
                    {s.emoji} {t(`slot_${s.key}`)}
                  </button>
                  {active && (
                    <input
                      type="time"
                      value={times[s.key] ?? SLOT_DEFAULT_TIME[s.key]}
                      onChange={e => isPro ? setTimes(prev => ({ ...prev, [s.key]: e.target.value })) : showProPopup()}
                      onClick={() => { if (!isPro) showProPopup(); }}
                      readOnly={!isPro}
                      className={cn('h-8 text-xs rounded-lg border border-[hsl(35_25%_88%)] bg-white px-2 w-28', !isPro && 'opacity-50')}
                      title={!isPro ? t('pro_custom_times') : ''}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={!name.trim() || slots.length === 0} className="h-7 text-xs bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0" data-testid="btn-save-med">
              {t('save')}
            </Button>
            <Button size="sm" variant="ghost" onClick={resetForm} className="h-7 text-xs">{t('cancel')}</Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (medicines.length >= limit) {
              if (!isPro) showProPopup();
              else toast(t('med_limit_reached'), { duration: 2500 });
              return;
            }
            setShowAdd(true);
          }}
          className="flex items-center gap-1.5 text-xs text-[hsl(150_25%_40%)] hover:text-foreground transition-colors"
        >
          <Plus size={13} /> {t('add_medicine')} {!isPro && `(${medicines.length}/${limit})`}
        </button>
      )}
    </div>
  );
}
