import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { TaskCompletions, CompletionEntry } from '@/lib/companionTypes';

const STORAGE_KEY = 'companion_task_completions_v1';

// Generic accessor for the shared completion overlay, usable for any date/key
// (Home aggregator covers "today"; this covers arbitrary dates e.g. calendar events).
export function useTaskCompletions() {
  const [completions, setCompletions] = useLocalStorage<TaskCompletions>(STORAGE_KEY, {});

  const isDone = useCallback(
    (date: string, key: string) => !!completions[date]?.[key],
    [completions],
  );

  const toggle = useCallback(
    (date: string, key: string, entry: Omit<CompletionEntry, 'completedAt'>) => {
      let nowOn = false;
      setCompletions(prev => {
        const day = { ...(prev[date] ?? {}) };
        if (day[key]) {
          delete day[key];
          nowOn = false;
        } else {
          day[key] = { ...entry, completedAt: Date.now() };
          nowOn = true;
        }
        return { ...prev, [date]: day };
      });
      return nowOn;
    },
    [setCompletions],
  );

  return { completions, isDone, toggle };
}
