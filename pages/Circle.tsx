import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { UserCheck, X, BarChart3, Sparkles, UserPlus } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSocial } from '@/hooks/useSocial';
import { sampleUserById, REACTIONS, type FeedItem, type Reaction } from '@/lib/socialTypes';
import { defaultUsername } from '@/lib/socialTypes';
import Avatar from '@/components/social/Avatar';
import FriendComparison from '@/components/social/FriendComparison';
import { toast } from 'sonner';

export default function Circle() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const [, navigate] = useLocation();
  const {
    initialize, username, friends, feed, incomingRequests,
    acceptRequest, declineRequest, reactions, toggleReaction, sharingForFriend,
  } = useSocial();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    initialize(profile.username || username || defaultUsername(profile.displayName));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = friends.find(f => f.id === selectedId) ?? friends[0] ?? null;

  function feedText(item: FeedItem): string {
    const u = sampleUserById(item.userId);
    const name = u?.displayName ?? '';
    const v = String(item.value ?? '');
    return t(`feed_${item.kind}`).replace('{name}', name).replace('{value}', v);
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('your_circle')} backTo="/" right={
        <button onClick={() => navigate('/settings/invite')} className="p-1.5 rounded-full hover:bg-muted text-foreground" aria-label={t('invite_friend')}>
          <UserPlus size={20} />
        </button>
      } />

      <div className="px-4 py-4 space-y-6">
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
