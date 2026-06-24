import { useLocation } from 'wouter';
import { Menu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TopMenuButton() {
  const [location, navigate] = useLocation();
  const { t } = useLanguage();

  // Hide on settings/auth pages (they have their own headers).
  if (location.startsWith('/settings') || location.startsWith('/sign-')) return null;

  return (
    <button
      onClick={() => navigate('/settings')}
      aria-label={t('menu')}
      title={t('menu')}
      data-testid="btn-menu"
      className="flex items-center justify-center w-9 h-9 rounded-full border border-[hsl(35_25%_88%)] bg-white/80 hover:bg-[var(--brand-primary)] transition-colors shadow-sm text-foreground"
    >
      <Menu size={18} />
    </button>
  );
}
