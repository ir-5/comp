import { Link } from 'wouter';
import { CalendarRange, ListChecks, ChevronRight, StickyNote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SubPageHeader from '@/components/SubPageHeader';
import CalendarConnectPanel from '@/components/CalendarConnectPanel';
import EventCalendar from '@/components/EventCalendar';
import EventList from '@/components/EventList';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLanguage } from '@/contexts/LanguageContext';

interface StoredEvent {
  id: string;
  type: string;
  title: string;
  datetime: string | null;
  recurrence: string | null;
}

export default function CalendarPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useLocalStorage<StoredEvent[]>('companion_events', []);

  const datedEventCount = events.filter(e => e.datetime).length;

  function deleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('cal_page_title')} backTo="/timeline" />

      <div className="px-4 py-4 space-y-5">
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('cal_page_intro')}</p>
        </div>

        <CalendarConnectPanel />

        <Card className="border-[hsl(35_25%_88%)] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-foreground">{t('cal_companion_events')}</p>
              {datedEventCount > 0 && (
                <span className="text-[10px] font-medium bg-[hsl(220_60%_96%)] text-[hsl(220_40%_55%)] px-2 py-0.5 rounded-full">
                  {datedEventCount}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">{t('cal_companion_events_desc')}</p>

            {datedEventCount === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm text-muted-foreground">{t('no_events_yet')}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">{t('events_hint')}</p>
                <Link
                  href="/note"
                  className="inline-flex items-center gap-1 text-sm text-[hsl(150_25%_40%)] font-medium hover:underline"
                  data-testid="cal-add-from-note"
                >
                  <StickyNote size={14} />
                  {t('cal_add_from_note')}
                  <ChevronRight size={14} />
                </Link>
              </div>
            ) : (
              <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3">
                  <TabsTrigger value="calendar" data-testid="cal-tab-month" className="text-xs gap-1.5">
                    <CalendarRange size={13} /> {t('calendar_view')}
                  </TabsTrigger>
                  <TabsTrigger value="list" data-testid="cal-tab-list" className="text-xs gap-1.5">
                    <ListChecks size={13} /> {t('events_list')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="calendar">
                  <EventCalendar events={events} />
                </TabsContent>
                <TabsContent value="list">
                  <EventList events={events} onDelete={deleteEvent} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-2">
          {t('cal_timeline_note')}
        </p>
      </div>
    </div>
  );
}
