import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useStreaks } from './useStreaks';
import {
  TaskItem,
  TaskCompletions,
  CompletionEntry,
  ManualTask,
  TaskPriority,
  Medicine,
  MedTracking,
  MedSlot,
  SavedNote,
  todayKey,
  dateKey,
  SLOT_DEFAULT_TIME,
} from '@/lib/companionTypes';
import { uid } from '@/lib/utils';

interface WaterData { date: string; count: number; goal: number; unit?: 'cups' | 'ml' | 'L'; clickAmount?: number; }
interface PlantData { id: string; name: string; frequencyDays: number; lastWatered: string; }
interface ParsedEvent { id: string; type: string; title: string; datetime: string | null; recurrence: string | null; }

const SLOT_LABEL: Record<MedSlot, string> = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' };
const SLOT_EMOJI: Record<MedSlot, string> = { morning: '🌅', afternoon: '☀️', evening: '🌙' };

export function useTodayTasks() {
  const today = todayKey();
  const { markComplete, undoComplete } = useStreaks();

  const [medicines] = useLocalStorage<Medicine[]>('companion_meds_list', []);
  const [tracking, setTracking] = useLocalStorage<MedTracking>('companion_meds_tracking', {});
  const [water, setWater] = useLocalStorage<WaterData>('companion_water', { date: today, count: 0, goal: 8 });
  const [plants, setPlants] = useLocalStorage<PlantData[]>('companion_plants', []);
  const [events] = useLocalStorage<ParsedEvent[]>('companion_events', []);
  const [savedNotes] = useLocalStorage<SavedNote[]>('companion_saved_notes', []);
  const [manualTasks, setManualTasks] = useLocalStorage<ManualTask[]>('companion_manual_tasks_v1', []);
  const [completions, setCompletions] = useLocalStorage<TaskCompletions>('companion_task_completions_v1', {});

  const todayCompletions = completions[today] ?? {};
  const isDone = (key: string) => !!todayCompletions[key];

  // ---- Derive today's tasks ----
  const derived: TaskItem[] = [];

  // Water (one task; complete = reach goal)
  const waterCount = water.date === today ? water.count : (dateKey(water.date) === today ? water.count : 0);
  const waterGoal = water.goal ?? 8;
  const waterKey = `water:${today}`;
  derived.push({
    key: waterKey,
    source: 'water',
    category: 'water',
    title: 'Drink water',
    subtitle: `${waterCount}/${waterGoal}`,
    priority: 'normal',
    completed: isDone(waterKey) || waterCount >= waterGoal,
    emoji: '💧',
  });

  // Medicines (per slot)
  medicines.forEach(med => {
    med.slots.forEach(slot => {
      const key = `med:${med.id}:${slot}:${today}`;
      const tracked = !!tracking[today]?.[med.id]?.[slot];
      const time = med.times?.[slot] ?? SLOT_DEFAULT_TIME[slot];
      derived.push({
        key,
        source: 'med',
        category: 'meds',
        title: med.name,
        subtitle: `${time} · ${SLOT_LABEL[slot]}${med.dose ? ` · ${med.dose}` : ''}`,
        priority: 'normal',
        completed: tracked || isDone(key),
        refId: med.id,
        emoji: SLOT_EMOJI[slot],
      });
    });
  });

  // Plants due today
  plants.forEach(plant => {
    const last = new Date(plant.lastWatered);
    const next = new Date(last);
    next.setDate(next.getDate() + plant.frequencyDays);
    const dueToday = next.getTime() - Date.now() <= 86400000; // due within a day or overdue
    const wateredToday = dateKey(plant.lastWatered) === today;
    if (!dueToday && !wateredToday) return;
    const key = `plant:${plant.id}:${today}`;
    derived.push({
      key,
      source: 'plant',
      category: 'plant',
      title: `Water ${plant.name}`,
      subtitle: 'Plant care',
      priority: 'normal',
      completed: wateredToday || isDone(key),
      refId: plant.id,
      emoji: '🌿',
    });
  });

  // Calendar events today
  events.forEach(ev => {
    if (!ev.datetime) return;
    if (dateKey(ev.datetime) !== today) return;
    const key = `event:${ev.id}:${today}`;
    derived.push({
      key,
      source: 'event',
      category: 'event',
      title: ev.title,
      subtitle: new Date(ev.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      dueAt: ev.datetime,
      priority: 'normal',
      completed: isDone(key),
      refId: ev.id,
      emoji: ev.type === 'appointment' ? '📅' : ev.type === 'plant' ? '🌿' : ev.type === 'recurring' ? '💊' : '⏰',
    });
  });

  // Urgent / high-priority notes not yet completed
  savedNotes.forEach(note => {
    if (note.priority !== 'high' && note.priority !== 'urgent') return;
    if (note.completedAt) return;
    const key = `note:${note.id}`;
    derived.push({
      key,
      source: 'note',
      category: 'note',
      title: note.title || 'Note',
      subtitle: note.priority === 'urgent' ? 'Urgent note' : 'Important note',
      priority: note.priority,
      completed: isDone(key),
      refId: note.id,
      emoji: note.priority === 'urgent' ? '🔴' : '⭐',
    });
  });

  // Manual tasks for today
  manualTasks
    .filter(mt => mt.date === today)
    .forEach(mt => {
      const key = `manual:${mt.id}`;
      derived.push({
        key,
        source: 'manual',
        category: 'task',
        title: mt.title,
        priority: mt.priority,
        completed: isDone(key),
        refId: mt.id,
        emoji: '📝',
      });
    });

  const priorityRank: Record<TaskPriority, number> = { urgent: 0, high: 1, normal: 2 };
  const tasks = derived.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityRank[a.priority] - priorityRank[b.priority];
  });

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // ---- Mutations ----

  const recordCompletion = useCallback(
    (task: TaskItem, on: boolean) => {
      setCompletions(prev => {
        const day = { ...(prev[today] ?? {}) };
        if (on) {
          const entry: CompletionEntry = {
            completedAt: Date.now(),
            title: task.title,
            category: task.category,
            source: task.source,
            refId: task.refId,
            emoji: task.emoji,
          };
          day[task.key] = entry;
        } else {
          delete day[task.key];
        }
        return { ...prev, [today]: day };
      });
    },
    [setCompletions, today],
  );

  const completeTask = useCallback(
    (task: TaskItem) => {
      // Update underlying state where meaningful
      if (task.source === 'water') {
        setWater(prev => ({ ...prev, date: today, count: Math.max(prev.date === today ? prev.count : 0, prev.goal ?? 8) }));
        markComplete('water');
      } else if (task.source === 'med' && task.refId) {
        const [, medId, slot] = task.key.split(':');
        setTracking(prev => {
          const day = prev[today] ?? {};
          const med = day[medId] ?? {};
          return { ...prev, [today]: { ...day, [medId]: { ...med, [slot]: true } } };
        });
        markComplete('meds');
      } else if (task.source === 'plant' && task.refId) {
        setPlants(prev => prev.map(p => (p.id === task.refId ? { ...p, lastWatered: new Date().toISOString() } : p)));
        markComplete('plant');
      } else if (task.source === 'note') {
        markComplete('notes');
      } else {
        markComplete('tasks');
      }
      recordCompletion(task, true);
    },
    [today, setWater, setTracking, setPlants, markComplete, recordCompletion],
  );

  const uncompleteTask = useCallback(
    (task: TaskItem) => {
      if (task.source === 'med' && task.refId) {
        const [, medId, slot] = task.key.split(':');
        setTracking(prev => {
          const day = prev[today] ?? {};
          const med = day[medId] ?? {};
          return { ...prev, [today]: { ...day, [medId]: { ...med, [slot]: false } } };
        });
        undoComplete('meds');
      } else if (task.source === 'water') {
        undoComplete('water');
      } else if (task.source === 'plant') {
        undoComplete('plant');
      } else if (task.source === 'note') {
        undoComplete('notes');
      } else {
        undoComplete('tasks');
      }
      recordCompletion(task, false);
    },
    [today, setTracking, undoComplete, recordCompletion],
  );

  const addManualTask = useCallback(
    (title: string, priority: TaskPriority = 'normal') => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setManualTasks(prev => [
        { id: uid(), title: trimmed, date: today, priority, createdAt: Date.now() },
        ...prev,
      ]);
    },
    [setManualTasks, today],
  );

  const deleteManualTask = useCallback(
    (id: string) => setManualTasks(prev => prev.filter(t => t.id !== id)),
    [setManualTasks],
  );

  // ---- History (completed items across days) ----
  const history = Object.entries(completions)
    .flatMap(([date, entries]) =>
      Object.entries(entries).map(([key, entry]) => ({ date, key, ...entry })),
    )
    .sort((a, b) => b.completedAt - a.completedAt);

  const deleteHistoryEntry = useCallback(
    (date: string, key: string) => {
      setCompletions(prev => {
        const day = { ...(prev[date] ?? {}) };
        delete day[key];
        return { ...prev, [date]: day };
      });
    },
    [setCompletions],
  );

  return {
    tasks,
    activeTasks,
    completedTasks,
    completeTask,
    uncompleteTask,
    addManualTask,
    deleteManualTask,
    history,
    deleteHistoryEntry,
  };
}
