import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  CALENDAR_SYNC_STORAGE_KEY,
  EMPTY_CALENDAR_SYNC,
  type CalendarProviderId,
  type CalendarSyncState,
} from '@/lib/calendarSync';
import { DEFAULT_PERMISSIONS, type PermissionPrefs } from '@/lib/companionTypes';

export function useCalendarSync() {
  const [state, setState] = useLocalStorage<CalendarSyncState>(
    CALENDAR_SYNC_STORAGE_KEY,
    EMPTY_CALENDAR_SYNC,
  );
  const [, setPermissions] = useLocalStorage<PermissionPrefs>(
    'companion_permissions',
    DEFAULT_PERMISSIONS,
  );

  const grantPermission = useCallback(
    (provider: CalendarProviderId) => {
      setState(prev => ({
        ...prev,
        [provider]: { status: 'permission_granted', grantedAt: Date.now() },
      }));
      setPermissions(prev => ({ ...prev, calendar: true }));
    },
    [setState, setPermissions],
  );

  const revokePermission = useCallback(
    (provider: CalendarProviderId) => {
      setState(prev => ({
        ...prev,
        [provider]: { status: 'disconnected', grantedAt: null },
      }));
    },
    [setState],
  );

  const hasAnyPermission = Object.values(state).some(c => c.status === 'permission_granted');

  return {
    providers: state,
    grantPermission,
    revokePermission,
    hasAnyPermission,
  };
}
