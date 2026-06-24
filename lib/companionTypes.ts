// Shared domain types + date helpers for Companion.
// All new persisted records use todayKey() (YYYY-MM-DD) for stable, comparable keys.

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dateKey(iso: string | number | Date): string {
  return todayKey(new Date(iso));
}

export function addDaysKey(key: string, days: number): string {
  const d = new Date(key + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

export function isSameDayKey(a: string, b: string): boolean {
  return a === b;
}

// ---- Streaks ----

export type StreakCategory =
  | 'water'
  | 'meds'
  | 'plant'
  | 'tasks'
  | 'notes'
  | 'steps'
  | 'sleep'
  | 'period';

export interface StreakRecord {
  totalDays: number;
  currentCount: number;
  bestCount: number;
  lastCompletedDate: string | null; // todayKey
  completedDates: string[]; // recent todayKeys (capped)
}

export type StreaksState = Record<StreakCategory, StreakRecord>;

export const EMPTY_STREAK: StreakRecord = {
  totalDays: 0,
  currentCount: 0,
  bestCount: 0,
  lastCompletedDate: null,
  completedDates: [],
};

// ---- Today tasks ----

export type TaskCategory = 'water' | 'meds' | 'plant' | 'event' | 'note' | 'task';
export type TaskSource = 'water' | 'med' | 'plant' | 'event' | 'note' | 'manual';
export type TaskPriority = 'normal' | 'high' | 'urgent';

export interface TaskItem {
  key: string; // stable, e.g. water:2026-06-23, med:<id>:morning:2026-06-23
  source: TaskSource;
  category: TaskCategory;
  title: string;
  subtitle?: string;
  dueAt?: string | null; // ISO datetime if known
  priority: TaskPriority;
  completed: boolean;
  refId?: string; // underlying entity id (medId, eventId, noteId, manualId)
  emoji: string;
}

export interface CompletionEntry {
  completedAt: number;
  title: string;
  category: TaskCategory;
  source: TaskSource;
  refId?: string;
  emoji: string;
}

export type TaskCompletions = Record<string, Record<string, CompletionEntry>>; // date -> key -> entry

export interface ManualTask {
  id: string;
  title: string;
  date: string; // todayKey it belongs to
  priority: TaskPriority;
  createdAt: number;
}

// ---- Home customization ----

export type HomeSection =
  | 'whatToDoToday'
  | 'noteBanner'
  | 'mood'
  | 'parking'
  | 'upcomingEvents'
  | 'statsStrip'
  | 'quickTimer'
  | 'healthSummary'
  | 'periodTracker'
  | 'recentNotes';

export interface HomeConfig {
  version: number;
  order: HomeSection[];
  visible: Record<HomeSection, boolean>;
}

export const DEFAULT_HOME_ORDER: HomeSection[] = [
  'whatToDoToday',
  'noteBanner',
  'mood',
  'parking',
  'upcomingEvents',
  'statsStrip',
  'quickTimer',
  'healthSummary',
  'periodTracker',
  'recentNotes',
];

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  version: 1,
  order: DEFAULT_HOME_ORDER,
  visible: {
    whatToDoToday: true,
    noteBanner: true,
    mood: true,
    parking: false,  // Hidden by default per user request
    upcomingEvents: true,
    statsStrip: true,
    quickTimer: true,
    healthSummary: false,
    periodTracker: false,
    recentNotes: false,
  },
};

// ---- Saved notes (Note Writer) ----

export type NoteFont = 'sans' | 'serif' | 'rounded' | 'mono' | 'hand';

export interface NoteStyle {
  bold?: boolean;
  italic?: boolean;
  light?: boolean;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  font?: NoteFont;
  noteColor?: string; // background swatch key
  fontColor?: string; // text color key
}

export interface SavedNote {
  id: string;
  content: string;
  title: string;
  starred: boolean; // pinned
  priority: TaskPriority;
  style: NoteStyle;
  completedAt: number | null;
  createdAt: number;
}

export const NOTE_FONTS: Record<NoteFont, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  rounded: 'font-sans tracking-tight',
  mono: 'font-mono',
  hand: 'font-serif italic',
};

// ---- Medicine (shared shape used by MedChecklist + aggregator) ----

export type MedSlot = 'morning' | 'afternoon' | 'evening';

export interface Medicine {
  id: string;
  name: string;
  dose?: string;
  slots: MedSlot[];
  times?: Partial<Record<MedSlot, string>>; // slot -> "HH:MM"
  schedule?: 'daily' | 'as-needed' | 'weekly';
}

export interface MedTracking {
  [date: string]: {
    [medId: string]: Partial<Record<MedSlot, boolean>>;
  };
}

export const SLOT_DEFAULT_TIME: Record<MedSlot, string> = {
  morning: '08:00',
  afternoon: '14:00',
  evening: '21:00',
};

// ---- Appearance / themes ----

export type ThemeKey = 'blossom' | 'lavender' | 'ocean' | 'matcha' | 'sunset' | 'midnight';
export const THEMES: ThemeKey[] = ['blossom', 'lavender', 'ocean', 'matcha', 'sunset', 'midnight'];
export const DEFAULT_THEME: ThemeKey = 'blossom';

export const THEME_META: Record<ThemeKey, { emoji: string; name: string }> = {
  blossom: { emoji: '🌸', name: 'Blossom' },
  lavender: { emoji: 'lavender', name: 'Lavender' },
  ocean: { emoji: '🌊', name: 'Ocean' },
  matcha: { emoji: '🍵', name: 'Matcha' },
  sunset: { emoji: '🍑', name: 'Sunset' },
  midnight: { emoji: '🌙', name: 'Midnight' },
};

// ---- Privacy / permissions ----

export type PermissionKey = 'health' | 'calendar' | 'email' | 'location' | 'ai';
export const PERMISSION_KEYS: PermissionKey[] = ['health', 'calendar', 'email', 'location', 'ai'];
export type PermissionPrefs = Record<PermissionKey, boolean>;
export const DEFAULT_PERMISSIONS: PermissionPrefs = {
  health: false,
  calendar: false,
  email: false,
  location: false,
  ai: true,
};

// ---- Report a problem ----

export interface ProblemReport {
  id: string;
  type: string;
  description: string;
  email: string;
  screenshot?: string | null; // dataURL
  createdAt: number;
}

// ---- AI usage (client-side daily limit) ----

export interface AiUsage {
  date: string; // todayKey
  count: number;
}

export const AI_FREE_DAILY_LIMIT = 5;
