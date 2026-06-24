import { useRef, useState } from 'react';
import { useUser } from '@clerk/react';
import { Check, ImagePlus, X } from 'lucide-react';
import SubPageHeader from '@/components/SubPageHeader';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { ProblemReport } from '@/lib/companionTypes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TYPES = ['bug', 'idea', 'account', 'other'] as const;

export default function ReportProblem() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [reports, setReports] = useLocalStorage<ProblemReport[]>('companion_reports', []);
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<(typeof TYPES)[number]>('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress ?? '');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function pickShot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_500_000) {
      toast.error(t('avatar_too_large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(String(reader.result));
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!description.trim()) {
      toast.error(t('report_need_desc'));
      return;
    }
    const report: ProblemReport = {
      id: `rep_${Date.now()}`,
      type,
      description: description.trim(),
      email: email.trim(),
      screenshot,
      createdAt: Date.now(),
    };
    setReports([report, ...reports]);
    setDone(true);
    toast.success(t('report_sent'));
  }

  if (done) {
    return (
      <div className="pb-24 min-h-screen bg-background">
        <SubPageHeader title={t('report_problem')} backTo="/settings" />
        <div className="px-6 py-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)] flex items-center justify-center">
            <Check size={28} className="text-[var(--brand-accent-deep)]" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{t('report_thanks_title')}</h2>
          <p className="text-sm text-muted-foreground max-w-xs">{t('report_thanks_body')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('report_problem')} backTo="/settings" />

      <div className="px-4 py-5 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{t('report_type')}</label>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map(ty => (
              <button
                key={ty}
                onClick={() => setType(ty)}
                data-testid={`report-type-${ty}`}
                className={cn(
                  'h-11 rounded-xl border text-sm font-medium transition-colors',
                  type === ty
                    ? 'bg-[var(--brand-primary)] border-[var(--brand-accent-soft)] text-[var(--brand-accent-deep)]'
                    : 'bg-white border-[hsl(35_25%_88%)] text-foreground',
                )}
              >
                {t(`report_type_${ty}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{t('report_desc')}</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('report_desc_ph')}
            rows={5}
            data-testid="input-report-desc"
            className="w-full rounded-xl border border-[hsl(35_25%_88%)] bg-white p-3 text-sm text-foreground focus:outline-none focus:border-[var(--brand-accent)] resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{t('report_email')}</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            data-testid="input-report-email"
            className="w-full h-11 rounded-xl border border-[hsl(35_25%_88%)] bg-white px-3 text-sm text-foreground focus:outline-none focus:border-[var(--brand-accent)]"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{t('report_screenshot')}</label>
          {screenshot ? (
            <div className="relative inline-block">
              <img src={screenshot} alt="" className="h-28 rounded-xl border border-[hsl(35_25%_88%)] object-cover" />
              <button
                onClick={() => setScreenshot(null)}
                className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              data-testid="btn-report-shot"
              className="w-full h-20 rounded-xl border-2 border-dashed border-[hsl(35_25%_82%)] bg-white flex flex-col items-center justify-center gap-1 text-muted-foreground"
            >
              <ImagePlus size={20} />
              <span className="text-xs">{t('report_add_screenshot')}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={pickShot} className="hidden" />
        </div>

        <Button
          onClick={submit}
          data-testid="btn-submit-report"
          className="w-full h-12 rounded-xl bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-deep)] text-white border-0 font-semibold"
        >
          {t('report_submit')}
        </Button>
      </div>
    </div>
  );
}
