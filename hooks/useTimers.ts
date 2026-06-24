import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { uid, formatDuration } from '@/lib/utils';

export interface ActiveTimer {
  id: string;
  label: string;
  durationMs: number;
  startedAt: number;
  pausedAt: number | null;
  pausedElapsed: number;
  completed: boolean;
  isPrioritized: boolean;
}

export const PRESET_TIMERS = [
  { label: '15-min Quick Clean', durationMs: 15 * 60 * 1000 },
  { label: '20-min Laundry', durationMs: 20 * 60 * 1000 },
  { label: '5-min Break', durationMs: 5 * 60 * 1000 },
  { label: '1-hour Focus', durationMs: 60 * 60 * 1000 },
];

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(label: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification("Great job! 🎉", {
      body: `Your "${label}" timer is done! You did amazing.`,
      icon: '/icon-192.png',
    });
  }
}

export function useTimers() {
  const [timers, setTimers] = useLocalStorage<ActiveTimer[]>('companion_timers', []);
  const [tick, setTick] = useState(0);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    timers.forEach(timer => {
      if (timer.completed || timer.pausedAt !== null) return;
      const elapsed = timer.pausedElapsed + (Date.now() - timer.startedAt);
      if (elapsed >= timer.durationMs && !notifiedRef.current.has(timer.id)) {
        notifiedRef.current.add(timer.id);
        sendNotification(timer.label);
        setTimers(prev => prev.map(t => t.id === timer.id ? { ...t, completed: true } : t));
      }
    });
  }, [tick, timers, setTimers]);

  const getRemainingMs = useCallback((timer: ActiveTimer): number => {
    if (timer.completed) return 0;
    const elapsed = timer.pausedAt !== null
      ? timer.pausedElapsed
      : timer.pausedElapsed + (Date.now() - timer.startedAt);
    return Math.max(0, timer.durationMs - elapsed);
  }, []);

  const getDisplayTime = useCallback((timer: ActiveTimer): string => {
    return formatDuration(getRemainingMs(timer));
  }, [getRemainingMs]);

  const getProgress = useCallback((timer: ActiveTimer): number => {
    const elapsed = timer.pausedAt !== null
      ? timer.pausedElapsed
      : timer.pausedElapsed + (Date.now() - timer.startedAt);
    return Math.min(100, (elapsed / timer.durationMs) * 100);
  }, []);

  const startTimer = useCallback((label: string, durationMs: number) => {
    requestNotificationPermission();
    const timer: ActiveTimer = {
      id: uid(),
      label,
      durationMs,
      startedAt: Date.now(),
      pausedAt: null,
      pausedElapsed: 0,
      completed: false,
      isPrioritized: false,
    };
    setTimers(prev => [timer, ...prev]);
    return timer.id;
  }, [setTimers]);

  const pauseTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id || t.pausedAt !== null) return t;
      return {
        ...t,
        pausedAt: Date.now(),
        pausedElapsed: t.pausedElapsed + (Date.now() - t.startedAt),
      };
    }));
  }, [setTimers]);

  const resumeTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id || t.pausedAt === null) return t;
      return { ...t, startedAt: Date.now(), pausedAt: null };
    }));
  }, [setTimers]);

  const cancelTimer = useCallback((id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  }, [setTimers]);

  const dismissCompleted = useCallback((id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  }, [setTimers]);

  const togglePrioritize = useCallback((id: string) => {
    setTimers(prev => {
      const target = prev.find(t => t.id === id);
      if (!target) return prev;
      const prioritizedCount = prev.filter(t => t.isPrioritized && t.id !== id).length;
      if (!target.isPrioritized && prioritizedCount >= 2) return prev;
      return prev.map(t => t.id === id ? { ...t, isPrioritized: !t.isPrioritized } : t);
    });
  }, [setTimers]);

  const prioritizedTimers = timers.filter(t => t.isPrioritized && !t.completed);

  return {
    timers,
    tick,
    prioritizedTimers,
    startTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    dismissCompleted,
    togglePrioritize,
    getRemainingMs,
    getDisplayTime,
    getProgress,
  };
}
