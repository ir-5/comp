// Demo (simulated) social layer types + seeded sample directory.
// Everything is on-device; "friends" are sample users from SAMPLE_USERS.

// Stats a user can choose to share with friends.
export type SharingKey = 'water' | 'meds' | 'plant' | 'steps' | 'tasks' | 'notes' | 'mood';

export const SHARING_KEYS: SharingKey[] = ['water', 'meds', 'plant', 'steps', 'tasks', 'notes', 'mood'];

export type SharingPrefs = Record<SharingKey, boolean>;

// Lively-but-still-opt-out defaults. Period / email / location are NOT shareable at all.
export const DEFAULT_SHARING: SharingPrefs = {
  water: true,
  meds: true,
  plant: true,
  steps: true,
  tasks: true,
  notes: true,
  mood: true,
};

export interface FriendStats {
  waterStreak: number;
  medsStreak: number;
  plantStreak: number;
  steps: number;
  tasksToday: number;
  notesCount: number;
  mood: string; // emoji label key, e.g. 'good'
}

export interface SampleUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string; // emoji
  accent: string; // hex accent for avatar bubble
  stats: FriendStats;
  // What this sample user shares back with you.
  sharing: SharingPrefs;
}

export interface Friend extends SampleUser {
  since: number; // when added
}

export type RequestDirection = 'incoming' | 'outgoing';

export interface FriendRequest {
  id: string;
  userId: string; // references a SampleUser id
  direction: RequestDirection;
  createdAt: number;
}

export type FeedKind =
  | 'water_goal'
  | 'meds_done'
  | 'plant_streak'
  | 'tasks_done'
  | 'mood'
  | 'joint_meds'
  | 'joint_water';

export interface FeedItem {
  id: string;
  userId: string;       // friend who triggered it ('' for joint-with-you)
  kind: FeedKind;
  value?: number;       // streak length etc.
  emoji: string;
  createdAt: number;
}

export const REACTIONS = ['💕', '⭐', '🌱', '👏'] as const;
export type Reaction = (typeof REACTIONS)[number];

// reactions: feedItemId -> array of reactions the user gave
export type ReactionMap = Record<string, Reaction[]>;

export interface SocialState {
  enabled: boolean;
  username: string;
  friends: Friend[];
  requests: FriendRequest[];
  sharing: SharingPrefs;          // what I share with friends
  perFriendSharing: Record<string, SharingPrefs>; // friendId -> what I let that friend see
  reactions: ReactionMap;
}

// ---- Seeded sample directory ----

export const SAMPLE_USERS: SampleUser[] = [
  {
    id: 'u_sara', username: 'sara_h', displayName: 'Sara', avatar: '🌸', accent: '#F4C2C2',
    stats: { waterStreak: 6, medsStreak: 4, plantStreak: 5, steps: 8200, tasksToday: 3, notesCount: 12, mood: 'great' },
    sharing: { water: true, meds: true, plant: true, steps: true, tasks: true, notes: true, mood: true },
  },
  {
    id: 'u_dana', username: 'dana.k', displayName: 'Dana', avatar: '🌿', accent: '#D1E7DD',
    stats: { waterStreak: 3, medsStreak: 7, plantStreak: 2, steps: 5400, tasksToday: 5, notesCount: 8, mood: 'good' },
    sharing: { water: true, meds: true, plant: false, steps: true, tasks: true, notes: false, mood: true },
  },
  {
    id: 'u_mariam', username: 'mariam01', displayName: 'Mariam', avatar: '🌼', accent: '#FCEFC7',
    stats: { waterStreak: 2, medsStreak: 3, plantStreak: 5, steps: 7000, tasksToday: 4, notesCount: 20, mood: 'okay' },
    sharing: { water: true, meds: false, plant: true, steps: true, tasks: true, notes: true, mood: false },
  },
  {
    id: 'u_lina', username: 'lina_w', displayName: 'Lina', avatar: '💧', accent: '#E2EAFC',
    stats: { waterStreak: 9, medsStreak: 5, plantStreak: 1, steps: 9100, tasksToday: 2, notesCount: 5, mood: 'good' },
    sharing: { water: true, meds: true, plant: true, steps: false, tasks: true, notes: true, mood: true },
  },
  {
    id: 'u_noor', username: 'noor.a', displayName: 'Noor', avatar: '⭐', accent: '#FDE9C8',
    stats: { waterStreak: 4, medsStreak: 4, plantStreak: 4, steps: 6300, tasksToday: 6, notesCount: 15, mood: 'great' },
    sharing: { water: true, meds: true, plant: true, steps: true, tasks: true, notes: true, mood: true },
  },
  {
    id: 'u_huda', username: 'huda_q', displayName: 'Huda', avatar: '🌷', accent: '#F4C2C2',
    stats: { waterStreak: 1, medsStreak: 2, plantStreak: 3, steps: 4200, tasksToday: 1, notesCount: 3, mood: 'tired' },
    sharing: { water: true, meds: true, plant: true, steps: true, tasks: false, notes: true, mood: true },
  },
];

export function sampleUserById(id: string): SampleUser | undefined {
  return SAMPLE_USERS.find(u => u.id === id);
}

export function isValidUsername(name: string): boolean {
  return /^[a-zA-Z0-9_.]{3,20}$/.test(name);
}

export function defaultUsername(seed?: string | null): string {
  const base = (seed ?? '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 14);
  if (base.length >= 3) return base;
  return `me_${Math.random().toString(36).slice(2, 7)}`;
}

// Initial state when a user first turns social on.
export function seedSocialState(username: string): SocialState {
  const friends: Friend[] = [
    { ...SAMPLE_USERS[0], since: Date.now() - 86400000 * 3 }, // Sara
  ];
  const requests: FriendRequest[] = [
    { id: 'req_noor', userId: 'u_noor', direction: 'incoming', createdAt: Date.now() - 3600000 * 5 },
    { id: 'req_mariam', userId: 'u_mariam', direction: 'incoming', createdAt: Date.now() - 3600000 * 20 },
  ];
  return {
    enabled: true,
    username,
    friends,
    requests,
    sharing: { ...DEFAULT_SHARING },
    perFriendSharing: {},
    reactions: {},
  };
}

export const EMPTY_SOCIAL: SocialState = {
  enabled: false,
  username: '',
  friends: [],
  requests: [],
  sharing: { ...DEFAULT_SHARING },
  perFriendSharing: {},
  reactions: {},
};
