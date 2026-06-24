import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUser, useClerk } from '@clerk/react';
import {
  User, UserPlus, Palette, ShieldCheck, HelpCircle, Flag, Info,
  LogOut, Trash2, ChevronRight, ChevronLeft, Globe, AlertTriangle,
} from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { clearCompanionData } from '@/lib/storage';

interface RowDef {
  key: string;
  labelKey: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  to: string;
}

const ROWS: RowDef[] = [
  { key: 'profile', labelKey: 'profile', icon: User, to: '/settings/profile' },
  { key: 'invite', labelKey: 'invite_friend', icon: UserPlus, to: '/settings/invite' },
  { key: 'appearance', labelKey: 'appearance', icon: Palette, to: '/settings/appearance' },
  { key: 'privacy', labelKey: 'privacy_sharing', icon: ShieldCheck, to: '/settings/privacy' },
  { key: 'help', labelKey: 'help', icon: HelpCircle, to: '/settings/help' },
  { key: 'report', labelKey: 'report_problem', icon: Flag, to: '/settings/report' },
  { key: 'about', labelKey: 'about_app', icon: Info, to: '/settings/about' },
];

export default function Settings() {
  const { t, lang, setLang, isRTL } = useLanguage();
  const [, navigate] = useLocation();
  const { isSignedIn } = useUser();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  async function handleLogout() {
    try {
      await signOut();
    } catch {
      /* not signed in */
    }
    navigate('/');
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      if (isSignedIn && user) await user.delete();
    } catch {
      /* ignore */
    }
    clearCompanionData();
    try {
      await signOut();
    } catch {
      /* ignore */
    }
    window.location.href = (import.meta.env.BASE_URL || '/');
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('settings')} backTo="/" />

      <div className="px-4 py-4 space-y-5">
        {/* Language (first item, inline) */}
        <section>
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Globe size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">{t('language')}</span>
          </div>
          <div className="grid grid-cols-2 gap-2" data-testid="settings-language">
            {(['en', 'ar'] as const).map(code => (
              <button
                key={code}
                onClick={() => setLang(code)}
                data-testid={`lang-${code}`}
                className={cn(
                  'h-11 rounded-xl border text-sm font-semibold transition-colors',
                  lang === code
                    ? 'bg-[var(--brand-primary)] border-[hsl(150_30%_60%)] text-[var(--brand-accent-deep)]'
                    : 'bg-white border-[hsl(35_25%_88%)] text-foreground hover:bg-[hsl(40_20%_96%)]',
                )}
                style={{ fontFamily: code === 'ar' ? '"Noto Naskh Arabic", serif' : 'inherit' }}
              >
                {code === 'en' ? t('lang_english') : t('lang_arabic')}
              </button>
            ))}
          </div>
        </section>

        {/* Navigation rows */}
        <section className="rounded-2xl border border-[hsl(35_25%_88%)] bg-white overflow-hidden divide-y divide-[hsl(35_25%_92%)]">
          {ROWS.map(({ key, labelKey, icon: Icon, to }) => (
            <button
              key={key}
              onClick={() => navigate(to)}
              data-testid={`settings-${key}`}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-start hover:bg-[hsl(40_20%_97%)] transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-[hsl(40_20%_95%)] flex items-center justify-center text-foreground">
                <Icon size={17} />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{t(labelKey)}</span>
              <Chevron size={18} className="text-muted-foreground" />
            </button>
          ))}
        </section>

        {/* Account actions */}
        <section className="rounded-2xl border border-[hsl(35_25%_88%)] bg-white overflow-hidden divide-y divide-[hsl(35_25%_92%)]">
          {isSignedIn && (
            <button
              onClick={handleLogout}
              data-testid="settings-logout"
              className="w-full flex items-center gap-3 px-4 py-3.5 text-start hover:bg-[hsl(40_20%_97%)] transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-[hsl(40_20%_95%)] flex items-center justify-center text-foreground">
                <LogOut size={17} />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{t('log_out')}</span>
            </button>
          )}
          <button
            onClick={() => setConfirmDelete(true)}
            data-testid="settings-delete"
            className="w-full flex items-center gap-3 px-4 py-3.5 text-start hover:bg-red-50 transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <Trash2 size={17} />
            </span>
            <span className="flex-1 text-sm font-medium text-red-600">{t('delete_account')}</span>
          </button>
        </section>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-6" style={{ maxWidth: '480px', margin: '0 auto' }}>
          <div className="w-full bg-background rounded-2xl p-5 shadow-xl border border-[hsl(35_25%_88%)]">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3 mx-auto">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-foreground text-center mb-2">{t('delete_account')}</h3>
            <p className="text-sm text-muted-foreground text-center mb-5">{t('delete_account_confirm')}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                data-testid="btn-cancel-delete"
              >
                {t('cancel')}
              </Button>
              <Button
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
                onClick={handleDelete}
                disabled={deleting}
                data-testid="btn-confirm-delete"
              >
                {t('delete_account')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
