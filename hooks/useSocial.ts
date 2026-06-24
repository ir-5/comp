import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import {
  EMPTY_SOCIAL,
  seedSocialState,
  sampleUserById,
  SAMPLE_USERS,
  type SocialState,
  type Friend,
  type FeedItem,
  type SharingKey,
  type SharingPrefs,
  type Reaction,
  DEFAULT_SHARING,
} from '@/lib/socialTypes';

const KEY = 'companion_social';

// Build a stable, derived activity feed from a friend's shared stats.
function buildFeed(friends: Friend[]): FeedItem[] {
  const items: FeedItem[] = [];
  const now = Date.now();

  friends.forEach((f, idx) => {
    const base = now - idx * 3600000; // stagger so order is stable per friend
    if (f.sharing.water && f.stats.waterStreak >= 3) {
      items.push({ id: `${f.id}_water`, userId: f.id, kind: 'water_goal', value: f.stats.waterStreak, emoji: '💧', createdAt: base - 1000 });
    }
    if (f.sharing.meds && f.stats.medsStreak >= 3) {
      items.push({ id: `${f.id}_meds`, userId: f.id, kind: 'meds_done', value: f.stats.medsStreak, emoji: '💊', createdAt: base - 2000 });
    }
    if (f.sharing.plant && f.stats.plantStreak >= 3) {
      items.push({ id: `${f.id}_plant`, userId: f.id, kind: 'plant_streak', value: f.stats.plantStreak, emoji: '🌱', createdAt: base - 3000 });
    }
    if (f.sharing.tasks && f.stats.tasksToday >= 3) {
      items.push({ id: `${f.id}_tasks`, userId: f.id, kind: 'tasks_done', value: f.stats.tasksToday, emoji: '✅', createdAt: base - 4000 });
    }
    if (f.sharing.mood) {
      items.push({ id: `${f.id}_mood`, userId: f.id, kind: 'mood', emoji: '🙂', createdAt: base - 5000 });
    }
  });

  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export function useSocial() {
  const [state, setState] = useLocalStorage<SocialState>(KEY, EMPTY_SOCIAL);

  const initialize = useCallback((username: string) => {
    setState(prev => (prev.enabled ? prev : seedSocialState(username)));
  }, [setState]);

  const setUsername = useCallback((username: string) => {
    setState(prev => ({ ...prev, username }));
  }, [setState]);

  const disable = useCallback(() => {
    setState({ ...EMPTY_SOCIAL });
  }, [setState]);

  const acceptRequest = useCallback((reqId: string) => {
    setState(prev => {
      const req = prev.requests.find(r => r.id === reqId);
      if (!req) return prev;
      const user = sampleUserById(req.userId);
      if (!user) return prev;
      if (prev.friends.some(f => f.id === user.id)) {
        return { ...prev, requests: prev.requests.filter(r => r.id !== reqId) };
      }
      const friend: Friend = { ...user, since: Date.now() };
      return {
        ...prev,
        enabled: true,
        friends: [...prev.friends, friend],
        requests: prev.requests.filter(r => r.id !== reqId),
      };
    });
  }, [setState]);

  const declineRequest = useCallback((reqId: string) => {
    setState(prev => ({ ...prev, requests: prev.requests.filter(r => r.id !== reqId) }));
  }, [setState]);

  // Demo: adding by username auto-accepts (the sample user "accepts" instantly).
  const addFriendByUsername = useCallback((username: string): boolean => {
    const user = SAMPLE_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return false;
    let added = false;
    setState(prev => {
      if (prev.friends.some(f => f.id === user.id)) return prev;
      added = true;
      return {
        ...prev,
        enabled: true,
        friends: [...prev.friends, { ...user, since: Date.now() }],
        requests: prev.requests.filter(r => r.userId !== user.id),
      };
    });
    return added;
  }, [setState]);

  const removeFriend = useCallback((friendId: string) => {
    setState(prev => {
      const { [friendId]: _omit, ...rest } = prev.perFriendSharing;
      return { ...prev, friends: prev.friends.filter(f => f.id !== friendId), perFriendSharing: rest };
    });
  }, [setState]);

  const setSharing = useCallback((key: SharingKey, value: boolean) => {
    setState(prev => ({ ...prev, sharing: { ...prev.sharing, [key]: value } }));
  }, [setState]);

  const setPerFriendSharing = useCallback((friendId: string, key: SharingKey, value: boolean) => {
    setState(prev => {
      const current = prev.perFriendSharing[friendId] ?? { ...prev.sharing };
      return {
        ...prev,
        perFriendSharing: { ...prev.perFriendSharing, [friendId]: { ...current, [key]: value } },
      };
    });
  }, [setState]);

  const toggleReaction = useCallback((feedItemId: string, reaction: Reaction) => {
    setState(prev => {
      const current = prev.reactions[feedItemId] ?? [];
      const next = current.includes(reaction)
        ? current.filter(r => r !== reaction)
        : [...current, reaction];
      return { ...prev, reactions: { ...prev.reactions, [feedItemId]: next } };
    });
  }, [setState]);

  // What a given friend is allowed to see from me (per-friend override falls back to global).
  const sharingForFriend = useCallback((friendId: string): SharingPrefs => {
    return state.perFriendSharing[friendId] ?? state.sharing;
  }, [state.perFriendSharing, state.sharing]);

  const feed = useMemo(() => buildFeed(state.friends), [state.friends]);

  const incomingRequests = useMemo(
    () => state.requests.filter(r => r.direction === 'incoming'),
    [state.requests],
  );

  return {
    state,
    enabled: state.enabled,
    hasCircle: state.enabled && state.friends.length > 0,
    username: state.username,
    friends: state.friends,
    requests: state.requests,
    incomingRequests,
    sharing: state.sharing.water !== undefined ? state.sharing : DEFAULT_SHARING,
    reactions: state.reactions,
    feed,
    initialize,
    setUsername,
    disable,
    acceptRequest,
    declineRequest,
    addFriendByUsername,
    removeFriend,
    setSharing,
    setPerFriendSharing,
    sharingForFriend,
    toggleReaction,
  };
}
