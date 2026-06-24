import SubPageHeader from '@/components/SubPageHeader';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Tracker() {
  const { t } = useLanguage();
  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('tracker')} backTo="/" />
      <div className="px-6 py-16 text-center text-muted-foreground">{t('coming_soon')}</div>
    </div>
  );
}
