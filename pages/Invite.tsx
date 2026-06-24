import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, Search, UserPlus, UserCheck, X } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useSocial } from '@/hooks/useSocial';
import { SAMPLE_USERS, sampleUserById, defaultUsername } from '@/lib/socialTypes';
import { toast } from 'sonner';
import Avatar from '@/components/social/Avatar';

export default function Invite() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const {
    initialize, username, setUsername,
    friends, incomingRequests, acceptRequest, declineRequest, addFriendByUsername,
  } = useSocial();

  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState('');

  // Seed demo social state on first visit.
  useEffect(() => {
    const uname = profile.username || username || defaultUsername(profile.displayName);
    initialize(uname);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handle = username || profile.username || 'me';
  const link = `https://companion.app/i/${handle}`;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const friendIds = new Set(friends.map(f => f.id));
    return SAMPLE_USERS.filter(u =>
      !friendIds.has(u.id) &&
      (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)),
    );
  }, [query, friends]);

  function copyLink() {
    navigator.clipboard?.writeText(link).then(
      () => { setCopied(true); toast.success(t('link_copied')); setTimeout(() => setCopied(false), 1800); },
      () => toast.error(t('copy_failed')),
    );
  }

  function add(uname: string, name: string) {
    if (addFriendByUsername(uname)) {
      toast.success(t('friend_added').replace('{name}', name));
      setQuery('');
    }
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('invite_friend')} backTo="/settings" />

      <div className="px-4 py-5 space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">{t('invite_intro')}</p>

        {/* Invite link */}
        <section>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{t('invite_link')}</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-11 rounded-xl border border-[hsl(35_25%_88%)] bg-white px-3 flex items-center text-sm text-foreground truncate" dir="ltr">
              {link}
            </div>
            <Button
              onClick={copyLink}
              data-testid="btn-copy-link"
              className="h-11 px-4 rounded-xl bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-deep)] text-white border-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{t('invite_link_hint')}</p>
        </section>

        {/* Add by username */}
        <section>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{t('add_by_username')}</label>
          <div className="flex items-center rounded-xl border border-[hsl(35_25%_88%)] bg-white overflow-hidden focus-within:border-[var(--brand-accent)]">
            <Search size={16} className="ms-3 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('search_username_ph')}
              data-testid="input-search-username"
              className="flex-1 h-11 bg-transparent px-2 text-sm text-foreground focus:outline-none"
            />
          </div>

          <div className="mt-3 space-y-2">
            {query.trim() && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">{t('no_results')}</p>
            )}
            {results.map(u => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-[hsl(35_25%_88%)] bg-white p-2.5" data-testid={`search-result-${u.username}`}>
                <Avatar user={u} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{u.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
                <Button
                  onClick={() => add(u.username, u.displayName)}
                  data-testid={`btn-add-${u.username}`}
                  className="h-9 px-3 rounded-lg bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-deep)] text-white border-0 text-xs"
                >
                  <UserPlus size={14} className="me-1" /> {t('add')}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Incoming requests */}
        {incomingRequests.length > 0 && (
          <section>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              {t('friend_requests')} ({incomingRequests.length})
            </label>
            <div className="space-y-2">
              {incomingRequests.map(req => {
                const u = sampleUserById(req.userId);
                if (!u) return null;
                return (
                  <div key={req.id} className="flex items-center gap-3 rounded-xl border border-[hsl(35_25%_88%)] bg-white p-2.5" data-testid={`request-${u.username}`}>
                    <Avatar user={u} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{u.displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{t('wants_to_connect')}</p>
                    </div>
                    <button
                      onClick={() => { acceptRequest(req.id); toast.success(t('friend_added').replace('{name}', u.displayName)); }}
                      data-testid={`btn-accept-${u.username}`}
                      className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] text-white flex items-center justify-center"
                      aria-label={t('accept')}
                    >
                      <UserCheck size={16} />
                    </button>
                    <button
                      onClick={() => declineRequest(req.id)}
                      data-testid={`btn-decline-${u.username}`}
                      className="w-9 h-9 rounded-lg bg-[hsl(40_20%_95%)] text-muted-foreground flex items-center justify-center"
                      aria-label={t('decline')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
