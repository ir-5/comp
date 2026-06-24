import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useIsPro } from '@/components/ProGate';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn, uid } from '@/lib/utils';
import { ChevronDown, ChevronUp, Heart, Download, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

const SYMPTOMS_EN = [
  'Cramps', 'Bloating', 'Headache', 'Back pain', 'Breast tenderness',
  'Mood swings', 'Irritability', 'Anxiety', 'Tiredness', 'Trouble sleeping',
  'Acne/skin changes', 'Food cravings', 'Appetite changes', 'Nausea',
];
const SYMPTOMS_AR = [
  'تقلصات', 'انتفاخ', 'صداع', 'ألم في الظهر', 'ألم في الثدي',
  'تقلبات مزاجية', 'عصبية', 'قلق', 'تعب', 'صعوبة في النوم',
  'حب الشباب / تغيرات الجلد', 'شهية للطعام', 'تغيرات في الشهية', 'غثيان',
];

interface PeriodData {
  periodDays: string[];         // YYYY-MM-DD
  symptoms: Record<string, string[]>; // date -> symptom list
  pregnancyMode: boolean;
  daysSinceLastPeriod?: number;
  fertilityWindows: { start: string; end: string; id: string }[];
}

const DEFAULT_PERIOD: PeriodData = {
  periodDays: [],
  symptoms: {},
  pregnancyMode: false,
  fertilityWindows: [],
};

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getDayGrid(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

export default function PeriodTracker() {
  const { t, lang } = useLanguage();
  const isPro = useIsPro();
  const [data, setData] = useLocalStorage<PeriodData>('companion_period', DEFAULT_PERIOD);
  const [showSymptoms, setShowSymptoms] = useState(false);
  const [showFertility, setShowFertility] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fertilityStart, setFertilityStart] = useState('');
  const [fertilityEnd, setFertilityEnd] = useState('');
  const [daysInput, setDaysInput] = useState(String(data.daysSinceLastPeriod ?? ''));

  const today = formatDate(new Date());
  const todaySymptoms = data.symptoms[today] ?? [];
  const hasSymptoms = todaySymptoms.length > 0;
  const symptoms = lang === 'ar' ? SYMPTOMS_AR : SYMPTOMS_EN;

  function togglePeriodDay(dateStr: string) {
    setData(prev => {
      const days = prev.periodDays.includes(dateStr)
        ? prev.periodDays.filter(d => d !== dateStr)
        : [...prev.periodDays, dateStr];
      return { ...prev, periodDays: days };
    });
  }

  function toggleSymptom(symptom: string) {
    setData(prev => {
      const current = prev.symptoms[today] ?? [];
      const updated = current.includes(symptom)
        ? current.filter(s => s !== symptom)
        : [...current, symptom];
      return { ...prev, symptoms: { ...prev.symptoms, [today]: updated } };
    });
  }

  function togglePregnancy() {
    setData(prev => ({ ...prev, pregnancyMode: !prev.pregnancyMode }));
  }

  function saveFertilityWindow() {
    if (!fertilityStart || !fertilityEnd) return;
    setData(prev => ({
      ...prev,
      fertilityWindows: [...prev.fertilityWindows, { start: fertilityStart, end: fertilityEnd, id: uid() }],
    }));
    setFertilityStart('');
    setFertilityEnd('');
    toast(lang === 'ar' ? 'تم حفظ نافذة الخصوبة ✨' : 'Fertility window saved! ✨', { duration: 3000 });
  }

  function removeFertilityWindow(id: string) {
    setData(prev => ({ ...prev, fertilityWindows: prev.fertilityWindows.filter(w => w.id !== id) }));
  }

  function saveDays() {
    const n = parseInt(daysInput);
    if (!isNaN(n) && n >= 0) {
      setData(prev => ({ ...prev, daysSinceLastPeriod: n }));
      toast(lang === 'ar' ? 'تم الحفظ ✓' : 'Saved ✓', { duration: 2000 });
    }
  }

  function downloadPDF() {
    if (!isPro) return;
    // Build simple text report
    const lines: string[] = [
      'Period History Report — Companion',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      `Period days (${data.periodDays.length}): ${data.periodDays.join(', ') || 'none'}`,
      '',
      'Symptoms by date:',
      ...Object.entries(data.symptoms).map(([date, s]) => `  ${date}: ${s.join(', ')}`),
      '',
      'Fertility windows:',
      ...data.fertilityWindows.map(w => `  ${w.start} → ${w.end}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'period-history.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast('Report downloaded! 📄', { duration: 3000 });
  }

  const days = getDayGrid();
  const recentPeriodDays = data.periodDays.slice().sort().reverse().slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Pregnancy mode */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-[hsl(340_60%_98%)] border border-[hsl(340_40%_90%)]">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {lang === 'ar' ? 'هل أنتِ حامل؟' : 'Are you pregnant?'}
          </p>
          {data.pregnancyMode && (
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'ar' ? 'كم عدد الأيام منذ آخر دورة؟' : 'How many days since your last period?'}
            </p>
          )}
        </div>
        <button
          onClick={togglePregnancy}
          className={cn(
            'w-12 h-6 rounded-full transition-all duration-300 relative',
            data.pregnancyMode ? 'bg-[hsl(340_50%_65%)]' : 'bg-[hsl(35_20%_85%)]'
          )}
        >
          <div className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300',
            data.pregnancyMode ? 'translate-x-6' : 'translate-x-0'
          )} />
        </button>
      </div>

      {data.pregnancyMode ? (
        <div className="p-3 rounded-xl bg-[hsl(340_40%_98%)] border border-[hsl(340_30%_90%)] space-y-2">
          <p className="text-sm text-foreground font-medium">
            {lang === 'ar' ? 'عدد الأيام منذ آخر دورة' : 'Days since last period'}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="365"
              value={daysInput}
              onChange={e => setDaysInput(e.target.value)}
              className="w-24 h-9 border border-[hsl(35_25%_88%)] rounded-lg px-3 text-sm bg-white text-foreground outline-none focus:border-[hsl(340_40%_70%)]"
              placeholder="0"
            />
            <Button size="sm" onClick={saveDays} className="h-9 bg-[hsl(340_50%_80%)] text-[hsl(340_30%_20%)] hover:bg-[hsl(340_50%_72%)] border-0">
              {lang === 'ar' ? 'حفظ' : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === 'ar' ? '🌸 صحتك بالسلامة' : '🌸 Wishing you good health'}
          </p>
        </div>
      ) : (
        <>
          {/* Symptom message */}
          {hasSymptoms && (
            <div className="p-3 rounded-xl bg-[hsl(340_40%_96%)] border border-[hsl(340_30%_88%)] text-center">
              <p className="text-sm font-semibold text-[hsl(340_40%_45%)]">
                {lang === 'ar' ? 'ما تشوفين شر ☹️ 💕' : 'Get well soon ☹️💕'}
              </p>
            </div>
          )}

          {/* 30-day heart grid */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {lang === 'ar' ? 'أيام الدورة — اضغطي على قلب لتسجيل اليوم' : 'Period days — tap a heart to log a day'}
            </p>
            <div className="grid grid-cols-10 gap-1">
              {days.map(day => {
                const ds = formatDate(day);
                const isToday = ds === today;
                const isPeriod = data.periodDays.includes(ds);
                const isFertile = data.fertilityWindows.some(w => ds >= w.start && ds <= w.end);
                return (
                  <button
                    key={ds}
                    onClick={() => togglePeriodDay(ds)}
                    title={ds}
                    className={cn(
                      'flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all active:scale-90',
                      isToday ? 'ring-1 ring-[hsl(340_50%_65%)] ring-offset-1' : ''
                    )}
                  >
                    <span className="text-[8px] text-muted-foreground leading-none">
                      {day.getDate()}
                    </span>
                    <Heart
                      size={14}
                      className={cn(
                        'transition-all',
                        isPeriod
                          ? 'text-[hsl(340_60%_45%)]'
                          : isFertile
                          ? 'text-[hsl(340_40%_75%)]'
                          : 'text-[hsl(35_20%_82%)]'
                      )}
                      fill={isPeriod ? 'currentColor' : isFertile ? 'currentColor' : 'none'}
                    />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Heart size={10} fill="hsl(340,60%,45%)" className="text-[hsl(340_60%_45%)]" />
                <span className="text-[9px] text-muted-foreground">{lang === 'ar' ? 'دورة' : 'Period'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart size={10} fill="hsl(340,40%,75%)" className="text-[hsl(340_40%_75%)]" />
                <span className="text-[9px] text-muted-foreground">{lang === 'ar' ? 'أيام الخصوبة' : 'Fertile'}</span>
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <button
              onClick={() => setShowSymptoms(v => !v)}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <span>🌸</span>
                {lang === 'ar' ? 'إضافة أعراض' : 'Add symptoms'}
                {todaySymptoms.length > 0 && (
                  <span className="text-[10px] bg-[hsl(340_40%_90%)] text-[hsl(340_40%_40%)] px-1.5 py-0.5 rounded-full">
                    {todaySymptoms.length}
                  </span>
                )}
              </span>
              {showSymptoms ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>
            {showSymptoms && (
              <div className="flex flex-wrap gap-2 pb-2">
                {symptoms.map((s, i) => {
                  const enS = SYMPTOMS_EN[i];
                  const selected = todaySymptoms.includes(enS);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSymptom(enS)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-all',
                        selected
                          ? 'bg-[hsl(340_40%_88%)] border-[hsl(340_40%_70%)] text-[hsl(340_30%_30%)] font-medium'
                          : 'bg-white border-[hsl(35_25%_88%)] text-muted-foreground hover:border-[hsl(340_40%_70%)]'
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fertility window */}
          <div>
            <button
              onClick={() => setShowFertility(v => !v)}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <span>🌷</span>
                {lang === 'ar' ? 'أيام الخصوبة' : 'Fertility window'}
              </span>
              {showFertility ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>
            {showFertility && (
              <div className="space-y-3 pb-2">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'من' : 'From'}</label>
                    <input type="date" value={fertilityStart} onChange={e => setFertilityStart(e.target.value)}
                      className="w-full h-8 border border-[hsl(35_25%_88%)] rounded-lg px-2 text-xs bg-white text-foreground outline-none mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'إلى' : 'To'}</label>
                    <input type="date" value={fertilityEnd} onChange={e => setFertilityEnd(e.target.value)}
                      className="w-full h-8 border border-[hsl(35_25%_88%)] rounded-lg px-2 text-xs bg-white text-foreground outline-none mt-0.5" />
                  </div>
                  <Button size="sm" onClick={saveFertilityWindow} className="mt-4 h-8 bg-[hsl(340_40%_85%)] text-[hsl(340_30%_25%)] hover:bg-[hsl(340_40%_78%)] border-0 shrink-0">
                    <Plus size={12} />
                  </Button>
                </div>
                {data.fertilityWindows.map(w => (
                  <div key={w.id} className="flex items-center justify-between text-xs text-muted-foreground bg-[hsl(340_30%_97%)] p-2 rounded-lg">
                    <span>🌷 {w.start} → {w.end}</span>
                    <button onClick={() => removeFertilityWindow(w.id)} className="hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <button
              onClick={() => setShowHistory(v => !v)}
              className="w-full flex items-center justify-between py-2 text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <span>📋</span>
                {lang === 'ar' ? 'السجل' : 'Period history'}
              </span>
              {showHistory ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>
            {showHistory && (
              <div className="space-y-2 pb-2">
                {recentPeriodDays.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    {lang === 'ar' ? 'لا يوجد سجل بعد — اضغطي على القلوب أعلاه لتسجيل أيام الدورة' : 'No history yet — tap the hearts above to log period days'}
                  </p>
                ) : (
                  recentPeriodDays.map(d => (
                    <div key={d} className="flex items-center justify-between text-xs py-1.5 border-b border-[hsl(35_25%_92%)] last:border-0">
                      <span className="text-foreground font-medium">{d}</span>
                      {data.symptoms[d]?.length ? (
                        <span className="text-muted-foreground">{data.symptoms[d].slice(0, 2).join(', ')}{data.symptoms[d].length > 2 ? ' +' + (data.symptoms[d].length - 2) : ''}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  ))
                )}
                {isPro && data.periodDays.length > 0 && (
                  <Button
                    size="sm"
                    onClick={downloadPDF}
                    className="w-full mt-2 h-8 gap-2 bg-[hsl(220_50%_95%)] text-[hsl(220_40%_40%)] hover:bg-[var(--brand-secondary)] border-0"
                  >
                    <Download size={12} />
                    {lang === 'ar' ? 'تنزيل تقرير PDF' : 'Download period report (PDF)'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
