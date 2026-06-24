import { useStreaks } from '@/hooks/useStreaks';
import { useTodayTasks } from '@/hooks/useTodayTasks';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { SharingKey } from '@/lib/socialTypes';

interface HealthData { steps: number }
interface MoodData { mood: string }

export interface MyStats {
  water: number;
  meds: number;
  plant: number;
  steps: number;
  tasks: number;
  notes: number;
  mood: string;
}

// Maps a friend's FriendStats field onto the same shape so comparisons line up.
export function friendValue(stats: {
  waterStreak: number; medsStreak: number; plantStreak: number;
  steps: number; tasksToday: number; notesCount: number; mood: string;
}, key: SharingKey): number | string {
  switch (key) {
    case 'water': return stats.waterStreak;
    case 'meds': return stats.medsStreak;
    case 'plant': return stats.plantStreak;
    case 'steps': return stats.steps;
    case 'tasks': return stats.tasksToday;
    case 'notes': return stats.notesCount;
    case 'mood': return stats.mood;
  }
}

export function useMyStats(): { stats: MyStats; value: (key: SharingKey) => number | string } {
  const { getStreak } = useStreaks();
  const { completedTasks } = useTodayTasks();
  const [health] = useLocalStorage<HealthData>('companion_health', { steps: 0 });
  const [notes] = useLocalStorage<unknown[]>('companion_saved_notes', []);
  const [mood] = useLocalStorage<MoodData | null>('companion_mood', null);

  const stats: MyStats = {
    water: getStreak('water').currentCount,
    meds: getStreak('meds').currentCount,
    plant: getStreak('plant').currentCount,
    steps: health.steps ?? 0,
    tasks: completedTasks.length,
    notes: notes.length,
    mood: mood?.mood ?? 'okay',
  };

  const value = (key: SharingKey): number | string => (key === 'mood' ? stats.mood : stats[key]);

  return { stats, value };
}
