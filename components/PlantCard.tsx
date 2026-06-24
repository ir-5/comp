import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn, uid } from '@/lib/utils';
import { Droplets, Plus, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export interface Plant {
  id: string;
  name: string;
  frequencyDays: number;
  lastWatered: string;
}

export function usePlants() {
  return useLocalStorage<Plant[]>('companion_plants', []);
}

function daysUntilWater(plant: Plant): number {
  const last = new Date(plant.lastWatered);
  const next = new Date(last);
  next.setDate(next.getDate() + plant.frequencyDays);
  const diff = next.getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function waterProgress(plant: Plant): number {
  const last = new Date(plant.lastWatered);
  const now = Date.now();
  const elapsed = now - last.getTime();
  return Math.min(100, (elapsed / (plant.frequencyDays * 86400000)) * 100);
}

interface SinglePlantCardProps {
  plant: Plant;
  onWater: (id: string) => void;
  onDelete: (id: string) => void;
}

function SinglePlantCard({ plant, onWater, onDelete }: SinglePlantCardProps) {
  const days = daysUntilWater(plant);
  const progress = waterProgress(plant);
  const isDue = days <= 0;
  const isComingSoon = days === 1;

  return (
    <div
      data-testid={`plant-card-${plant.id}`}
      className={cn(
        'p-3 rounded-xl border transition-all duration-200',
        isDue ? 'border-[hsl(35_80%_70%)] bg-[hsl(40_80%_97%)]' : 'border-[hsl(35_25%_88%)] bg-white'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm text-foreground">{plant.name}</p>
          <p className={cn(
            'text-xs mt-0.5',
            isDue ? 'text-[hsl(35_70%_45%)] font-medium' : isComingSoon ? 'text-[hsl(35_60%_45%)]' : 'text-muted-foreground'
          )}>
            {isDue ? 'Needs water today!' : isComingSoon ? 'Due tomorrow' : `${days} days until water`}
          </p>
        </div>
        <button
          onClick={() => onDelete(plant.id)}
          data-testid={`btn-delete-plant-${plant.id}`}
          className="text-muted-foreground hover:text-foreground p-1 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <Progress
        value={progress}
        className={cn('h-1.5 mb-2', isDue ? '[&>div]:bg-[hsl(35_70%_55%)]' : '[&>div]:bg-[hsl(150_40%_60%)]')}
      />
      <Button
        size="sm"
        variant="outline"
        className="w-full h-8 text-xs gap-1 border-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-primary)]"
        onClick={() => onWater(plant.id)}
        data-testid={`btn-water-${plant.id}`}
      >
        <Droplets size={12} />
        Watered today
      </Button>
    </div>
  );
}

export default function PlantCards() {
  const [plants, setPlants] = usePlants();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [freq, setFreq] = useState('7');

  function waterPlant(id: string) {
    setPlants(prev => prev.map(p => p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p));
  }

  function deletePlant(id: string) {
    setPlants(prev => prev.filter(p => p.id !== id));
  }

  function addPlant() {
    if (!name.trim()) return;
    const newPlant: Plant = {
      id: uid(),
      name: name.trim(),
      frequencyDays: parseInt(freq) || 7,
      lastWatered: new Date().toISOString(),
    };
    setPlants(prev => [...prev, newPlant]);
    setName('');
    setFreq('7');
    setShowAdd(false);
  }

  return (
    <div data-testid="plant-cards">
      {plants.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground text-center py-2">
          No plants yet — add one to track watering!
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {plants.map(plant => (
          <SinglePlantCard key={plant.id} plant={plant} onWater={waterPlant} onDelete={deletePlant} />
        ))}
      </div>
      {showAdd ? (
        <div className="flex flex-col gap-2 p-3 bg-[hsl(40_20%_97%)] rounded-xl border border-[hsl(35_25%_88%)]">
          <Input
            placeholder="Plant name (e.g. Snake plant)"
            value={name}
            onChange={e => setName(e.target.value)}
            data-testid="input-plant-name"
            className="text-sm h-9"
          />
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="1"
              max="365"
              placeholder="Days between watering"
              value={freq}
              onChange={e => setFreq(e.target.value)}
              data-testid="input-plant-freq"
              className="text-sm h-9"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addPlant} className="flex-1 h-8 bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[hsl(150_32%_80%)] border-0" data-testid="btn-save-plant">
              Add plant
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="h-8" data-testid="btn-cancel-plant">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdd(true)}
          className="w-full h-9 gap-1 border-dashed border-[hsl(35_25%_85%)] text-muted-foreground"
          data-testid="btn-add-plant"
        >
          <Plus size={14} />
          Add plant
        </Button>
      )}
    </div>
  );
}
