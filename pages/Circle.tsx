import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { UserCheck, X, BarChart3, Sparkles, UserPlus, Plus, Camera, Video, Clock, Eye, MoreHorizontal, Trash2, ChevronLeft } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSocial } from '@/hooks/useSocial';
import { sampleUserById, REACTIONS, type FeedItem, type Reaction } from '@/lib/socialTypes';
import { defaultUsername } from '@/lib/socialTypes';
import Avatar from '@/components/social/Avatar';
import FriendComparison from '@/components/social/FriendComparison';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { uid, cn } from '@/lib/utils';

// Story types
interface Story {
  id: string;
  userId: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  createdAt: number;
  expiresAt: number;
  views: number;
  viewers: string[];
}

interface StoryGroup {
  userId: string;
  user: ReturnType<typeof sampleUserById>;
  stories: Story[];
  hasUnseen: boolean;
}

const STORY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function Circle() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const [, navigate] = useLocation();
  const {
    initialize, username, friends, feed, incomingRequests,
    acceptRequest, declineRequest, reactions, toggleReaction, sharingForFriend,
  } = useSocial();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stories, setStories] = useLocalStorage<Story[]>('companion_stories', []);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [viewingStory, setViewingStory] = useState<{ userId: string; index: number } | null>(null);
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryType, setNewStoryType] = useState<'photo' | 'video'>('photo');

  useEffect(() => {
    initialize(profile.username || username || defaultUsername(profile.displayName));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean expired stories
  useEffect(() => {
    const now = Date.now();
    setStories(prev => prev.filter(s => s.expiresAt > now));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = friends.find(f => f.id === selectedId) ?? friends[0] ?? null;

  function feedText(item: FeedItem): string {
    const u = sampleUserById(item.userId);
    const name = u?.displayName ?? '';
    const v = String(item.value ?? '');
    return t(`feed_${item.kind}`).replace('{name}', name).replace('{value}', v);
  }

  // Group stories by user
  const storyGroups: StoryGroup[] = [];
  const userStoryMap = new Map<string, Story[]>();
  stories.forEach(s => {
    const existing = userStoryMap.get(s.userId) || [];
    existing.push(s);
    userStoryMap.set(s.userId, existing);
  });

  friends.forEach(f => {
    const userStories = userStoryMap.get(f.id) || [];
    if (userStories.length > 0) {
      storyGroups.push({
        userId: f.id,
        user: f,
        stories: userStories.sort((a, b) => a.createdAt - b.createdAt),
        hasUnseen: userStories.some(s => !s.viewers.includes('me')),
      });
    }
  });

  // Add current user's stories
  const myStories = stories.filter(s => s.userId === 'me');
  if (myStories.length > 0) {
    storyGroups.unshift({
      userId: 'me',
      user: { id: 'me', displayName: 'You', avatar: '🙋', accent: '#D1E7DD' } as any,
      stories: myStories.sort((a, b) => a.createdAt - b.createdAt),
      hasUnseen: false,
    });
  }

  function createStory() {
    if (!newStoryCaption.trim()) return;
    const now = Date.now();
    const story: Story = {
      id: uid(),
      userId: 'me',
      type: newStoryType,
      mediaUrl: newStoryType === 'photo' ? '📸' : '🎬',
      caption: newStoryCaption,
      createdAt: now,
      expiresAt: now + STORY_DURATION_MS,
      views: 0,
      viewers: [],
    };
    setStories(prev => [...prev, story]);
    setNewStoryCaption('');
    setShowCreateStory(false);
    toast.success('Story posted! 🎉');
  }

  function viewStory(userId: string, index: number = 0) {
    setViewingStory({ userId, index });
    // Mark as viewed
    setStories(prev => prev.map(s => {
      if (s.userId === userId && !s.viewers.includes('me')) {
        return { ...s, views: s.views + 1, viewers: [...s.viewers, 'me'] };
      }
      return s;
    }));
  }

  function nextStory() {
    if (!viewingStory) return;
    const group = storyGroups.find(g => g.userId === viewingStory.userId);
    if (!group) return;
    if (viewingStory.index < group.stories.length - 1) {
      setViewingStory({ ...viewingStory, index: viewingStory.index + 1 });
    } else {
      // Move to next user's stories
      const currentIdx = storyGroups.findIndex(g => g.userId === viewingStory.userId);
      if (currentIdx < storyGroups.length - 1) {
        const nextGroup = storyGroups[currentIdx + 1];
        viewStory(nextGroup.userId, 0);
      } else {
        setViewingStory(null);
      }
    }
  }

  function deleteStory(storyId: string) {
    setStories(prev => prev.filter(s => s.id !== storyId));
    if (viewingStory) {
      const group = storyGroups.find(g => g.userId === viewingStory.userId);
      if (group && group.stories.length <= 1) {
        setViewingStory(null);
      }
    }
    toast.success('Story deleted');
  }

  const currentViewingStory = viewingStory
    ? storyGroups.find(g => g.userId === viewingStory.userId)?.stories[viewingStory.index]
    : null;
  const currentViewingUser = viewingStory
    ? storyGroups.find(g => g.userId === viewingStory.userId)?.user
    : null;

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('your_circle')} backTo="/" right={
        <button onClick={() => navigate('/settings/invite')} className="p-1.5 rounded-full hover:bg-muted text-foreground" aria-label={t('invite_friend')}>
          <UserPlus size={20} />
        </button>
      } />

      <div className="px-4 py-4 space-y-6">
        {/* Stories */}
        {storyGroups.length > 0 && (
          <section>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
              {/* Add story button */}
              <button
                onClick={() => setShowCreateStory(true)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-[64px] h-[64px] rounded-full bg-[hsl(150_30%_95%)] border-2 border-dashed border-[var(--brand-accent)] flex items-center justify-center">
                  <Plus size={24} className="text-[var(--brand-accent)]" />
                </div>
                <span className="text-[10px] text-muted-foreground">Add story</span>
              </button>

              {/* Story avatars */}
              {storyGroups.map(group => (
                <button
                  key={group.userId}
                  onClick={() => viewStory(group.userId)}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div className={cn(
                    'w-[64px] h-[64px] rounded-full p-0.5',
                    group.hasUnseen ? 'bg-gradient-to-tr from-[hsl(340_60%_55%)] to-[hsl(220_60%_55%)]' : 'bg-[hsl(35_25%_88%)]'
                  )}>
                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                      <span className="text-2xl">{group.user?.avatar || '👤'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-foreground max-w-[56px] truncate">
                    {group.userId === 'me' ? 'You' : group.user?.displayName}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Create story modal */}
        {showCreateStory && (
          <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-[360px] bg-background rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Create Story</h3>
                <button onClick={() => setShowCreateStory(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setNewStoryType('photo')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2',
                    newStoryType === 'photo'
                      ? 'border-[var(--brand-accent)] bg-[var(--brand-primary)] text-[var(--brand-accent-deep)]'
                      : 'border-[hsl(35_25%_88%)] bg-white text-muted-foreground'
                  )}
                >
                  <Camera size={16} /> Photo
                </button>
                <button
                  onClick={() => setNewStoryType('video')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2',
                    newStoryType === 'video'
                      ? 'border-[var(--brand-accent)] bg-[var(--brand-primary)] text-[var(--brand-accent-deep)]'
                      : 'border-[hsl(35_25%_88%)] bg-white text-muted-foreground'
                  )}
                >
                  <Video size={16} /> Video
                </button>
              </div>

              {newStoryType === 'video' && (
                <p className="text-xs text-muted-foreground text-center">Videos are limited to 5-10 seconds</p>
              )}

              <textarea
                value={newStoryCaption}
                onChange={e => setNewStoryCaption(e.target.value)}
                placeholder="Add a caption..."
                rows={3}
                className="w-full text-sm text-foreground bg-[hsl(40_20%_97%)] rounded-xl p-3 resize-none outline-none border border-[hsl(35_25%_88%)]"
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateStory(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={createStory}
                  disabled={!newStoryCaption.trim()}
                  className="flex-1 bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent-deep)] border-0"
                >
                  Post Story
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Story viewer */}
        {viewingStory && currentViewingStory && currentViewingUser && (
          <div className="fixed inset-0 z-[190] bg-black flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={() => setViewingStory(null)} className="p-1">
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentViewingUser.avatar}</span>
                <span className="text-sm font-medium">{currentViewingUser.displayName}</span>
              </div>
              {viewingStory.userId === 'me' && (
                <button
                  onClick={() => deleteStory(currentViewingStory.id)}
                  className="p-1 text-white/70 hover:text-white"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            {/* Progress indicators */}
            <div className="flex gap-1 px-4">
              {storyGroups.find(g => g.userId === viewingStory.userId)?.stories.map((s, i) => (
                <div
                  key={s.id}
                  className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden"
                >
                  <div
                    className={cn(
                      'h-full bg-white transition-all duration-300',
                      i < viewingStory.index ? 'w-full' : i === viewingStory.index ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Content */}
            <div
              className="flex-1 flex items-center justify-center cursor-pointer"
              onClick={nextStory}
            >
              <div className="text-6xl mb-4">{currentViewingStory.mediaUrl}</div>
              {currentViewingStory.caption && (
                <p className="text-white text-lg text-center px-8">{currentViewingStory.caption}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 text-white/70 text-sm">
              <div className="flex items-center gap-1">
                <Eye size={14} />
                <span>{currentViewingStory.views} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>Expires in 24h</span>
              </div>
            </div>
          </div>
        )}

        {/* Friends strip */}
        <section>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {friends.map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedId(f.id)}
                data-testid={`circle-friend-${f.username}`}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className={selected?.id === f.id ? 'ring-2 ring-[var(--brand-accent)] rounded-full p-0.5' : 'p-0.5'}>
                  <Avatar user={f} size={52} />
                </div>
                <span className="text-[11px] text-foreground max-w-[56px] truncate">{f.displayName}</span>
              </button>
            ))}
            <button
              onClick={() => navigate('/settings/invite')}
              className="flex flex-col items-center gap-1 shrink-0"
              data-testid="circle-add-friend"
            >
              <span className="w-[52px] h-[52px] rounded-full bg-[hsl(40_20%_95%)] flex items-center justify-center text-muted-foreground">
                <UserPlus size={22} />
              </span>
              <span className="text-[11px] text-muted-foreground">{t('add')}</span>
            </button>
          </div>
        </section>

        {/* Incoming requests */}
        {incomingRequests.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2">{t('friend_requests')}</h2>
            <div className="space-y-2">
              {incomingRequests.map(req => {
                const u = sampleUserById(req.userId);
                if (!u) return null;
                return (
                  <div key={req.id} className="flex items-center gap-3 rounded-xl border border-[hsl(35_25%_88%)] bg-white p-2.5">
                    <Avatar user={u} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{t('wants_to_connect')}</p>
                    </div>
                    <button onClick={() => { acceptRequest(req.id); toast.success(t('friend_added').replace('{name}', u.displayName)); }} className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] text-white flex items-center justify-center" aria-label={t('accept')}>
                      <UserCheck size={16} />
                    </button>
                    <button onClick={() => declineRequest(req.id)} className="w-9 h-9 rounded-lg bg-[hsl(40_20%_95%)] text-muted-foreground flex items-center justify-center" aria-label={t('decline')}>
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Activity feed */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Sparkles size={15} className="text-[var(--brand-accent)]" /> {t('circle_activity')}
          </h2>
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('feed_empty')}</p>
          ) : (
            <div className="space-y-2.5">
              {feed.map(item => {
                const u = sampleUserById(item.userId);
                if (!u) return null;
                const mine = reactions[item.id] ?? [];
                return (
                  <div key={item.id} className="rounded-2xl border border-[hsl(35_25%_88%)] bg-white p-3" data-testid={`feed-${item.id}`}>
                    <div className="flex items-start gap-3">
                      <Avatar user={u} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{feedText(item)} <span>{item.emoji}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {REACTIONS.map(r => {
                        const active = mine.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => toggleReaction(item.id, r as Reaction)}
                            data-testid={`react-${item.id}-${r}`}
                            className={`px-2 py-1 rounded-full text-sm transition-transform active:scale-90 border ${active ? 'bg-[var(--brand-primary)] border-[var(--brand-accent-soft)]' : 'bg-white border-[hsl(35_25%_90%)]'}`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Comparison */}
        {selected && (
          <section>
            <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5">
              <BarChart3 size={15} className="text-[var(--brand-accent)]" /> {t('comparison_with').replace('{name}', selected.displayName)}
            </h2>
            <FriendComparison friend={selected} mySharing={sharingForFriend(selected.id)} />
          </section>
        )}
      </div>
    </div>
  );
}
