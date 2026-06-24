import { useState } from 'react';
import { Droplets, Pill, Sprout, Footprints, CheckCircle2, StickyNote, Smile, Heart, Calendar, Mail, MapPin, Sparkles } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import PermissionsModal from '@/components/PermissionsModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSocial } from '@/hooks/useSocial';
import { SHARING_KEYS, type SharingKey } from '@/lib/socialTypes';
import { DEFAULT_PERMISSIONS, PERMISSION_KEYS, type PermissionKey, type PermissionPrefs } from '@/lib/companionTypes';

const SHARE_META: Record<SharingKey, React.ComponentType<{ size?: number; className?: string }>> = {
  water: Droplets, meds: Pill, plant: Sprout, steps: Footprints, tasks: CheckCircle2, notes: StickyNote, mood: Smile,
};

const PERM_META: Record<PermissionKey, { icon: React.ComponentType<{ size?: number; className?: string }>; emoji: string }> = {
  health: { icon: Heart, emoji: '❤️' },
  calendar: { icon: Calendar, emoji: '📅' },
  email: { icon: Mail, emoji: '✉️' },
  location: { icon: MapPin, emoji: '📍' },
  ai: { icon: Sparkles, emoji: '✨' },
};

export default function Privacy() {
  const { t } = useLanguage();
  const { enabled: socialEnabled, sharing, setSharing } = useSocial();
  const [perms, setPerms] = useLocalStorage<PermissionPrefs>('companion_permissions', DEFAULT_PERMISSIONS);
  const [pending, setPending] = useState<PermissionKey | null>(null);

  function togglePerm(key: PermissionKey, next: boolean) {
    if (next) {
      setPending(key); // ask before enabling
    } else {
      setPerms(prev => ({ ...prev, [key]: false }));
    }
  }

  function confirmPerm() {
    if (!pending) return;
    setPerms(prev => ({ ...prev, [pending]: true }));
    setPending(null);
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('privacy_sharing')} backTo="/settings" />

      <div className="px-4 py-5 space-y-7">
        {/* Friend visibility */}
        {socialEnabled && (
          <section>
            <h2 className="text-sm font-bold text-foreground mb-1">{t('friend_visibility')}</h2>
            <p className="text-xs text-muted-foreground mb-3">{t('friend_visibility_desc')}</p>
            <div className="rounded-2xl border border-[hsl(35_25%_88%)] bg-white overflow-hidden divide-y divide-[hsl(35_25%_92%)]">
              {SHARING_KEYS.map(key => {
                const Icon = SHARE_META[key];
                return (
                  <Row key={key} icon={<Icon size={17} />} label={t(`cat_${key}`)} checked={sharing[key]} onChange={v => setSharing(key, v)} testId={`share-${key}`} />
                );
              })}
            </div>
          </section>
        )}

        {/* Permissions */}
        <section>
          <h2 className="text-sm font-bold text-foreground mb-1">{t('permissions')}</h2>
          <p className="text-xs text-muted-foreground mb-3">{t('permissions_desc')}</p>
          <div className="rounded-2xl border border-[hsl(35_25%_88%)] bg-white overflow-hidden divide-y divide-[hsl(35_25%_92%)]">
            {PERMISSION_KEYS.map(key => {
              const { icon: Icon } = PERM_META[key];
              return (
                <Row
                  key={key}
                  icon={<Icon size={17} />}
                  label={t(`perm_${key}`)}
                  sub={t(`perm_${key}_sub`)}
                  checked={perms[key]}
                  onChange={v => togglePerm(key, v)}
                  testId={`perm-${key}`}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">{t('privacy_footer')}</p>
        </section>
      </div>

      {pending && (
        <PermissionsModal
          isOpen
          onClose={() => setPending(null)}
          onAllow={confirmPerm}
          serviceName={t(`perm_${pending}`)}
          serviceIcon={PERM_META[pending].emoji}
          description={t(`perm_${pending}_popup`)}
          permissions={[t(`perm_${pending}_allow1`), t(`perm_${pending}_allow2`)]}
        />
      )}
    </div>
  );
}

function Row({ icon, label, sub, checked, onChange, testId }: {
  icon: React.ReactNode; label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void; testId: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-8 h-8 rounded-full bg-[hsl(40_20%_95%)] flex items-center justify-center text-foreground shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        data-testid={`toggle-${testId}`}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[var(--brand-accent)]' : 'bg-[hsl(35_15%_82%)]'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'start-[22px]' : 'start-0.5'}`} />
      </button>
    </div>
  );
}
