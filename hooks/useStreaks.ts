import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  StreakCategory,
  StreaksState,
  StreakRecord,
  EMPTY_STREAK,
  todayKey,
  addDaysKey,
} from '@/lib/companionTypes';

const STORAGE_KEY = 'companion_streaks_v1';

const EMPTY_STATE: StreaksState = {
  water: { ...EMPTY_STREAK },
  meds: { ...EMPTY_STREAK },
  plant: { ...EMPTY_STREAK },
  tasks: { ...EMPTY_STREAK },
  notes: { ...EMPTY_STREAK },
  steps: { ...EMPTY_STREAK },
  sleep: { ...EMPTY_STREAK },
  period: { ...EMPTY_STREAK },
};

function getRecord(state: StreaksState, cat: StreakCategory): StreakRecord {
  return state[cat] ?? { ...EMPTY_STREAK };
}

export function useStreaks() {
  const [state, setState] = useLocalStorage<StreaksState>(STORAGE_KEY, EMPTY_STATE);

  // Idempotent: completing the same category twice in one day does nothing.
  // Never punishes a missed day — currentCount simply resets to 1 if the
  // chain was broken, but totalDays keeps growing as "days you showed up".
  const markComplete = useCallback(
    (cat: StreakCategory, date: string = todayKey()) => {
      setState(prev => {
        const rec = getRecord(prev, cat);
        if (rec.lastCompletedDate === date) return prev; // already counted today

        const yesterday = addDaysKey(date, -1);
        const continuing = rec.lastCompletedDate === yesterday;
        const currentCount = continuing ? rec.currentCount + 1 : 1;
        const completedDates = Array.from(new Set([date, ...rec.completedDates]))
          .sort()
          .slice(-60);

        return {
          ...prev,
          [cat]: {
            totalDays: rec.totalDays + 1,
            currentCount,
            bestCount: Math.max(rec.bestCount, currentCount),
            lastCompletedDate: date,
            completedDates,
          },
        };
      });
    },
    [setState],
  );

  const undoComplete = useCallback(
    (cat: StreakCategory, date: string = todayKey()) => {
      setState(prev => {
        const rec = getRecord(prev, cat);
        if (rec.lastCompletedDate !== date) return prev;
        const completedDates = rec.completedDates.filter(d => d !== date);
        const prevDate = completedDates[completedDates.length - 1] ?? null;
        return {
          ...prev,
          [cat]: {
            totalDays: Math.max(0, rec.totalDays - 1),
            currentCount: Math.max(0, rec.currentCount - 1),
            bestCount: rec.bestCount,
            lastCompletedDate: prevDate,
            completedDates,
          },
        };
      });
    },
    [setState],
  );

  const getStreak = useCallback(
    (cat: StreakCategory): StreakRecord => getRecord(state, cat),
    [state],
  );

  const isActiveToday = useCallback(
    (cat: StreakCategory, date: string = todayKey()): boolean =>
      getRecord(state, cat).lastCompletedDate === date,
    [state],
  );

  return { streaks: state, markComplete, undoComplete, getStreak, isActiveToday };
}
