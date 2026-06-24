import SubPageHeader from '@/components/SubPageHeader';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Help() {
  const { t } = useLanguage();
  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('help')} backTo="/settings" />
      <div className="px-6 py-16 text-center text-muted-foreground">{t('coming_soon')}</div>
    </div>
  );
}
