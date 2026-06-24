import { useState } from 'react';
import { Link2, Unlink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PermissionsModal from '@/components/PermissionsModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCalendarSync } from '@/hooks/useCalendarSync';
import {
  CALENDAR_PROVIDERS,
  type CalendarProviderId,
  type CalendarProviderMeta,
} from '@/lib/calendarSync';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CalendarConnectPanel() {
  const { t } = useLanguage();
  const { providers, grantPermission, revokePermission, hasAnyPermission } = useCalendarSync();
  const [pending, setPending] = useState<CalendarProviderMeta | null>(null);

  function openPermission(provider: CalendarProviderMeta) {
    setPending(provider);
  }

  function confirmPermission() {
    if (!pending) return;
    grantPermission(pending.id);
    setPending(null);
    toast(t('cal_permission_saved_toast'), { duration: 4000 });
  }

  function disconnect(id: CalendarProviderId) {
    revokePermission(id);
    toast(t('cal_disconnected_toast'), { duration: 2500 });
  }

  return (
    <>
      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{t('cal_sync_title')}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('cal_sync_subtitle')}</p>
          </div>

          {!hasAnyPermission && (
            <div className="p-3 rounded-xl bg-[hsl(220_50%_97%)] border border-[var(--brand-secondary)]">
              <p className="text-xs text-foreground leading-relaxed">{t('cal_sync_planning_note')}</p>
            </div>
          )}

          <div className="space-y-2">
            {CALENDAR_PROVIDERS.map(provider => {
              const conn = providers[provider.id];
              const granted = conn.status === 'permission_granted';

              return (
                <div
                  key={provider.id}
                  data-testid={`cal-provider-${provider.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(35_25%_90%)] bg-[hsl(40_20%_98%)]"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 bg-white border border-[hsl(35_25%_88%)]"
                    aria-hidden
                  >
                    {provider.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{t(provider.nameKey)}</p>
                      <StatusBadge granted={granted} t={t} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t(provider.descKey)}</p>
                  </div>
                  {granted ? (
                    <button
                      type="button"
                      onClick={() => disconnect(provider.id)}
                      data-testid={`cal-disconnect-${provider.id}`}
                      className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      title={t('cal_disconnect')}
                      aria-label={t('cal_disconnect')}
                    >
                      <Unlink size={16} />
                    </button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => openPermission(provider)}
                      data-testid={`cal-connect-${provider.id}`}
                      className="h-8 text-xs rounded-full px-3 border-0 bg-[hsl(40_20%_90%)] text-foreground hover:bg-[var(--brand-primary)] shrink-0 gap-1"
                    >
                      <Link2 size={12} />
                      {t('cal_connect')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {hasAnyPermission && (
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed px-1">
              {t('cal_native_sync_footer')}
            </p>
          )}
        </CardContent>
      </Card>

      {pending && (
        <PermissionsModal
          isOpen
          onClose={() => setPending(null)}
          onAllow={confirmPermission}
          serviceName={t(pending.nameKey)}
          serviceIcon={pending.icon}
          description={t(pending.permissionDescKey)}
          permissions={pending.permissionKeys.map(k => t(k))}
        />
      )}
    </>
  );
}

function StatusBadge({ granted, t }: { granted: boolean; t: (k: string) => string }) {
  if (!granted) {
    return (
      <span className="text-[10px] font-medium text-muted-foreground bg-[hsl(40_20%_94%)] px-2 py-0.5 rounded-full">
        {t('cal_status_disconnected')}
      </span>
    );
  }
  return (
    <span
      className={cn(
        'text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1',
        'text-[hsl(35_80%_35%)] bg-[hsl(40_60%_92%)]',
      )}
    >
      <Clock size={9} />
      {t('cal_status_permission_saved')}
    </span>
  );
}
