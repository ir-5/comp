import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLongPress } from '@/hooks/useLongPress';
import { cn, todayStr } from '@/lib/utils';
import { Droplets, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsPro } from '@/components/ProGate';
import { useProPopup } from '@/components/ProPopup';

type WaterUnit = 'cups' | 'ml' | 'L';

interface WaterData {
  date: string;
  count: number;
  goal: number;
  unit?: WaterUnit;
}

const UNIT_LABELS: Record<WaterUnit, string> = { cups: 'cups', ml: 'mL', L: 'L' };

function formatDisplay(count: number, goal: number, unit: WaterUnit): string {
  if (unit === 'ml') return `${count * 250}ml / ${goal * 250}ml`;
  if (unit === 'L') return `${(count * 0.25).toFixed(1)}L / ${(goal * 0.25).toFixed(1)}L`;
  return `${count}/${goal} cups`;
}

export default function WaterGrid() {
  const [waterData, setWaterData] = useLocalStorage<WaterData>('companion_water', { date: todayStr(), count: 0, goal: 8 });
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const isPro = useIsPro();
  const { showProPopup } = useProPopup();

  const today = todayStr();
  const count = waterData.date === today ? waterData.count : 0;
  const goal = waterData.goal ?? 8;
  const unit: WaterUnit = waterData.unit ?? 'cups';

  function toggleCup(index: number) {
    const currentCount = waterData.date === today ? waterData.count : 0;
    const newCount = index < currentCount ? index : index + 1;
    setWaterData({ ...waterData, date: today, count: newCount });
  }

  function saveGoal() {
    const newGoal = parseInt(goalInput);
    if (newGoal >= 1 && newGoal <= 20) {
      setWaterData({ ...waterData, goal: newGoal });
    }
    setEditing(false);
    setGoalInput('');
  }

  function setUnit(u: WaterUnit) {
    if (!isPro) {
      showProPopup();
      return;
    }
    setWaterData(prev => ({ ...prev, unit: u }));
  }

  const longPressProps = useLongPress({
    delay: 500,
    onLongPress: () => {
      setGoalInput(String(goal));
      setEditing(true);
    },
  });

  const getMessage = () => {
    if (count === 0) return `Tap a cup to track · Long-press to set goal 💧`;
    if (count < Math.floor(goal / 2)) return `${count} of ${goal} — every sip counts!`;
    if (count < goal) return `Halfway there — great job! 💧`;
    return "Fully hydrated today 🎉";
  };

  if (editing) {
    return (
      <div data-testid="water-grid-edit" className="space-y-3">
        <p className="text-sm font-medium text-foreground">Set your daily water goal</p>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min="1"
            max="20"
            value={goalInput}
            onChange={e => setGoalInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveGoal()}
            placeholder="e.g. 8"
            className="h-9 text-sm w-24"
            autoFocus
          />
          <span className="text-sm text-muted-foreground">cups per day</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={saveGoal} className="h-8 bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0">Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8">Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="water-grid">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{formatDisplay(count, goal, unit)}</p>
        <div className="flex items-center gap-2">
          {/* Unit selector — Pro only */}
          <div className="flex items-center gap-0.5">
            {(['cups', 'ml', 'L'] as WaterUnit[]).map(u => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded transition-all',
                  unit === u
                    ? 'bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] font-semibold'
                    : !isPro
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : 'text-muted-foreground hover:bg-[hsl(35_20%_92%)]'
                )}
                title={!isPro ? 'Pro: change water units' : `Switch to ${UNIT_LABELS[u]}`}
              >
                {UNIT_LABELS[u]}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setGoalInput(String(goal)); setEditing(true); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Edit goal"
          >
            <Settings2 size={13} />
          </button>
        </div>
      </div>
      <div className="flex gap-1.5 mb-2" {...longPressProps}>
        {Array.from({ length: goal }, (_, i) => (
          <button
            key={i}
            data-testid={`water-cup-${i}`}
            onClick={() => toggleCup(i)}
            className={cn(
              'flex-1 flex items-center justify-center h-10 rounded-lg border-2 transition-all duration-200 active:scale-95',
              i < count
                ? 'border-[hsl(210_80%_65%)] bg-[var(--brand-secondary)] text-[hsl(220_30%_30%)]'
                : 'border-[hsl(35_25%_88%)] bg-[hsl(35_20%_97%)] text-[hsl(0_0%_65%)]',
              goal > 10 && 'h-8'
            )}
          >
            <Droplets size={goal > 10 ? 11 : 14} strokeWidth={i < count ? 2.5 : 1.5} />
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{getMessage()}</p>
    </div>
  );
}
