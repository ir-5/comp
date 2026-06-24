import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile, Gender } from '@/contexts/ProfileContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const GENDER_OPTIONS: { value: Gender; en: string; ar: string; emoji: string }[] = [
  { value: 'male',   en: 'Male',   ar: 'ذكر',   emoji: '👦' },
  { value: 'female', en: 'Female', ar: 'أنثى',  emoji: '👧' },
  { value: 'other',  en: 'Other / prefer not to say', ar: 'أفضل عدم التحديد', emoji: '🌟' },
];

export default function ProfileSetupModal({ onClose }: Props) {
  const { setProfile } = useProfile();
  const { lang } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [gender, setGender] = useState<Gender>(null);
  const [birthdayInput, setBirthdayInput] = useState('');
  const [birthdayError, setBirthdayError] = useState('');

  function handleGenderSelect(g: Gender) {
    setGender(g);
    setStep(2);
  }

  function handleSkipGender() {
    setGender(null);
    setStep(2);
  }

  function parseBirthday(val: string): string | null {
    if (!val.trim()) return null;
    // Accept YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
    const ymd = val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) {
      const d = new Date(`${val}T00:00:00`);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return val;
    }
    const dmy = val.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmy) {
      const candidate = `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;
      const d = new Date(`${candidate}T00:00:00`);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1900) return candidate;
    }
    return null;
  }

  function handleFinish() {
    const parsed = parseBirthday(birthdayInput);
    if (birthdayInput.trim() && !parsed) {
      setBirthdayError(lang === 'ar' ? 'صيغة تاريخ غير صحيحة — جرب YYYY-MM-DD' : 'Invalid date — try YYYY-MM-DD');
      return;
    }
    setProfile(prev => ({
      ...prev,
      gender,
      birthday: parsed,
      profileSetup: true,
    }));
    onClose();
  }

  function handleSkipBirthday() {
    setProfile(prev => ({ ...prev, gender, profileSetup: true }));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div className="w-full max-w-[480px] bg-[var(--brand-surface)] rounded-t-3xl p-6 pb-10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-base font-bold text-foreground">
              {step === 1
                ? (lang === 'ar' ? 'أخبرنا عن نفسك 🌸' : 'A little about you 🌸')
                : (lang === 'ar' ? 'عيد ميلادك 🎂' : 'Your birthday 🎂')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 1
                ? (lang === 'ar' ? 'نستخدمه لتخصيص تجربتك' : 'Helps us personalize your experience')
                : (lang === 'ar' ? 'لنفاجئك في يوم ميلادك!' : "So we can surprise you on your birthday!")}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleGenderSelect(opt.value)}
                className={cn(
                  'w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left',
                  gender === opt.value
                    ? 'border-[var(--brand-primary)] bg-[hsl(150_30%_96%)]'
                    : 'border-[hsl(35_25%_88%)] bg-white hover:border-[var(--brand-primary)]'
                )}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm font-medium text-foreground">
                  {lang === 'ar' ? opt.ar : opt.en}
                </span>
              </button>
            ))}
            <button
              onClick={handleSkipGender}
              className="w-full text-center text-xs text-muted-foreground py-2 hover:text-foreground transition-colors"
            >
              {lang === 'ar' ? 'تخطي' : 'Skip for now'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                {lang === 'ar' ? 'تاريخ الميلاد (اختياري)' : 'Birthday (optional)'}
              </label>
              <Input
                type="date"
                value={birthdayInput}
                onChange={e => { setBirthdayInput(e.target.value); setBirthdayError(''); }}
                placeholder="YYYY-MM-DD"
                className="h-10 text-sm"
              />
              {birthdayError && <p className="text-xs text-red-500 mt-1">{birthdayError}</p>}
              <p className="text-xs text-muted-foreground mt-1.5">
                {lang === 'ar'
                  ? 'سيحصل على هدية برو مجانية لمدة 7 أيام في يوم ميلادك 🎁'
                  : "You'll get a free 7-day Pro gift on your birthday 🎁"}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleFinish}
                className="flex-1 bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0 font-semibold"
              >
                {lang === 'ar' ? 'حفظ' : 'Save & continue'}
              </Button>
              <Button variant="ghost" onClick={handleSkipBirthday} className="flex-1">
                {lang === 'ar' ? 'تخطي' : 'Skip'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
