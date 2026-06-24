import { useRef, useState } from 'react';
import { useUser } from '@clerk/react';
import { Camera, Check, X, User as UserIcon } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile, type Gender } from '@/contexts/ProfileContext';
import { useSocial } from '@/hooks/useSocial';
import { isValidUsername, SAMPLE_USERS } from '@/lib/socialTypes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RESERVED = SAMPLE_USERS.map(u => u.username.toLowerCase());

export default function Profile() {
  const { t, lang } = useLanguage();
  const { profile, setProfile } = useProfile();
  const { username: socialUsername, setUsername: setSocialUsername, enabled: socialEnabled } = useSocial();
  const { user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsernameField] = useState(profile.username || socialUsername || '');
  const [email, setEmail] = useState(profile.email || user?.primaryEmailAddress?.emailAddress || '');
  const [phone, setPhone] = useState(profile.phone);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [error, setError] = useState('');

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_500_000) {
      toast.error(t('avatar_too_large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  }

  function validateUsername(value: string): string {
    const v = value.trim().toLowerCase();
    if (!v) return '';
    if (!isValidUsername(v)) return t('username_invalid');
    if (RESERVED.includes(v) && v !== (socialUsername || '').toLowerCase()) return t('username_taken');
    return '';
  }

  function handleSave() {
    const uname = username.trim().toLowerCase();
    const err = validateUsername(uname);
    if (err) {
      setError(err);
      return;
    }
    setProfile(prev => ({
      ...prev,
      displayName: displayName.trim(),
      username: uname,
      email: email.trim(),
      phone: phone.trim(),
      gender,
      avatar,
      profileSetup: true,
    }));
    if (socialEnabled && uname) setSocialUsername(uname);
    toast.success(t('profile_saved'));
  }

  const initials = (displayName || email || 'U').trim().charAt(0).toUpperCase();

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('profile')} backTo="/settings" />

      <div className="px-4 py-5 space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--brand-primary)] flex items-center justify-center border-2 border-[var(--brand-accent-soft)]">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-[var(--brand-accent-deep)]">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              data-testid="btn-avatar"
              className="absolute -bottom-1 -end-1 w-9 h-9 rounded-full bg-[var(--brand-accent)] text-white flex items-center justify-center shadow-md"
              aria-label={t('change_photo')}
            >
              <Camera size={16} />
            </button>
          </div>
          {avatar && (
            <button onClick={() => setAvatar('')} className="text-xs text-muted-foreground flex items-center gap-1">
              <X size={12} /> {t('remove_photo')}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <Field label={t('display_name')}>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={t('display_name_ph')}
              data-testid="input-displayname"
              className="w-full h-11 rounded-xl border border-[hsl(35_25%_88%)] bg-white px-3 text-sm text-foreground focus:outline-none focus:border-[var(--brand-accent)]"
            />
          </Field>

          <Field label={t('username')} hint={t('username_hint')}>
            <div className="flex items-center rounded-xl border border-[hsl(35_25%_88%)] bg-white overflow-hidden focus-within:border-[var(--brand-accent)]">
              <span className="ps-3 text-sm text-muted-foreground">@</span>
              <input
                value={username}
                onChange={e => { setUsernameField(e.target.value); setError(''); }}
                placeholder="username"
                data-testid="input-username"
                className="flex-1 h-11 bg-transparent px-2 text-sm text-foreground focus:outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1" data-testid="username-error">{error}</p>}
          </Field>

          <Field label={t('email')}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              data-testid="input-email"
              className="w-full h-11 rounded-xl border border-[hsl(35_25%_88%)] bg-white px-3 text-sm text-foreground focus:outline-none focus:border-[var(--brand-accent)]"
            />
          </Field>

          <Field label={t('phone')}>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+965 ..."
              data-testid="input-phone"
              className="w-full h-11 rounded-xl border border-[hsl(35_25%_88%)] bg-white px-3 text-sm text-foreground focus:outline-none focus:border-[var(--brand-accent)]"
              dir="ltr"
            />
          </Field>

          <Field label={t('gender')}>
            <div className="grid grid-cols-3 gap-2">
              {(['female', 'male', 'other'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  data-testid={`gender-${g}`}
                  className={cn(
                    'h-10 rounded-xl border text-sm font-medium transition-colors',
                    gender === g
                      ? 'bg-[var(--brand-primary)] border-[var(--brand-accent-soft)] text-[var(--brand-accent-deep)]'
                      : 'bg-white border-[hsl(35_25%_88%)] text-foreground',
                  )}
                >
                  {t(`gender_${g}`)}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Button
          onClick={handleSave}
          data-testid="btn-save-profile"
          className="w-full h-12 rounded-xl bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-deep)] text-white border-0 font-semibold"
        >
          <Check size={18} className="me-1" /> {t('save')}
        </Button>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <UserIcon size={12} /> {lang === 'ar' ? 'بياناتك محفوظة على هذا الجهاز فقط.' : 'Your details are stored on this device only.'}
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
