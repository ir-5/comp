import { useLocation, Link } from 'wouter';
import { Home, MessageSquarePlus, CalendarDays, MapPin, Heart, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsPro } from '@/components/ProGate';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSocial } from '@/hooks/useSocial';

interface ParsedEvent { id: string; datetime: string | null; }

const BASE_TABS = [
  { key: 'tab_home', path: '/', icon: Home },
  { key: 'tab_note', path: '/note', icon: MessageSquarePlus },
  { key: 'tab_timeline', path: '/timeline', icon: CalendarDays },
  { key: 'tab_tracker', path: '/tracker', icon: MapPin },
  { key: 'tab_health', path: '/health', icon: Heart },
];

export default function BottomNav() {
  const [location] = useLocation();
  const [events] = useLocalStorage<ParsedEvent[]>('companion_events', []);
  const isPro = useIsPro();
  const { t } = useLanguage();
  const { hasCircle } = useSocial();

  const tabs = hasCircle
    ? [...BASE_TABS, { key: 'tab_circle', path: '/circle', icon: Users }]
    : BASE_TABS;

  const todayEvents = events.filter(e => {
    if (!e.datetime) return false;
    return new Date(e.datetime).toDateString() === new Date().toDateString();
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-white/95 backdrop-blur-sm"
      style={{ height: '64px', borderColor: 'hsl(35 25% 88%)', maxWidth: '480px', margin: '0 auto' }}
      data-testid="bottom-nav"
    >
      {tabs.map(({ key, path, icon: Icon }) => {
        const label = t(key);
        const isActive = path === '/' ? location === '/' : location.startsWith(path);
        const showBadge = path === '/note' && todayEvents.length > 0;
        const isHealth = path === '/health';

        return (
          <Link
            key={path}
            href={path}
            data-testid={`nav-${key.replace('tab_', '')}`}
            className={cn(
              'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 relative',
              isActive ? 'text-[var(--brand-accent-deep)]' : 'text-[hsl(0_0%_55%)]'
            )}
          >
            <div className={cn(
              'relative flex items-center justify-center rounded-full transition-all duration-200',
              isActive ? 'bg-[var(--brand-primary)] w-12 h-7' : 'w-12 h-7'
            )}>
              <Icon
                size={isHealth ? 18 : 20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(isHealth && !isPro && !isActive ? 'opacity-50' : '')}
              />
              {showBadge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(150_30%_55%)] rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                  {todayEvents.length > 9 ? '9+' : todayEvents.length}
                </span>
              )}
              {isHealth && !isPro && (
                <span className="absolute -top-1 -right-2 text-[8px] font-bold text-[hsl(220_40%_55%)] bg-[hsl(220_60%_95%)] px-1 rounded-full leading-4">
                  Pro
                </span>
              )}
            </div>
            <span className={cn('text-[10px] font-medium transition-all duration-200', isActive ? 'font-semibold' : '')}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
