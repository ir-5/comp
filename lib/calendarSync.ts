/** Calendar provider sync planning — permission intent only; no fake live sync. */

export type CalendarProviderId = 'google' | 'apple';

/** User granted access intent; native OAuth/EventKit not wired yet. */
export type CalendarConnectionStatus = 'disconnected' | 'permission_granted';

export interface CalendarProviderConnection {
  status: CalendarConnectionStatus;
  /** When the user confirmed the permission sheet (ms epoch). */
  grantedAt: number | null;
}

export type CalendarSyncState = Record<CalendarProviderId, CalendarProviderConnection>;

export const CALENDAR_SYNC_STORAGE_KEY = 'companion_calendar_sync_v1';

export const EMPTY_CALENDAR_SYNC: CalendarSyncState = {
  google: { status: 'disconnected', grantedAt: null },
  apple: { status: 'disconnected', grantedAt: null },
};

export interface CalendarProviderMeta {
  id: CalendarProviderId;
  nameKey: string;
  descKey: string;
  icon: string;
  dotColor: string;
  permissionKeys: string[];
  permissionDescKey: string;
}

export const CALENDAR_PROVIDERS: CalendarProviderMeta[] = [
  {
    id: 'google',
    nameKey: 'cal_provider_google',
    descKey: 'cal_provider_google_desc',
    icon: '📅',
    dotColor: 'hsl(150 50% 45%)',
    permissionDescKey: 'cal_perm_google_desc',
    permissionKeys: [
      'cal_perm_google_1',
      'cal_perm_google_2',
      'cal_perm_google_3',
    ],
  },
  {
    id: 'apple',
    nameKey: 'cal_provider_apple',
    descKey: 'cal_provider_apple_desc',
    icon: '🍎',
    dotColor: 'hsl(0 0% 20%)',
    permissionDescKey: 'cal_perm_apple_desc',
    permissionKeys: [
      'cal_perm_apple_1',
      'cal_perm_apple_2',
      'cal_perm_apple_3',
    ],
  },
];
