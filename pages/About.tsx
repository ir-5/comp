import SubPageHeader from '@/components/SubPageHeader';
import { useLanguage } from '@/contexts/LanguageContext';

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="pb-24 min-h-screen bg-background">
      <SubPageHeader title={t('about_app')} backTo="/settings" />
      <div className="px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Companion</h1>
          <p className="text-sm text-muted-foreground">Version 1.0.0</p>
        </div>
        <p className="text-sm text-muted-foreground text-center">{t('coming_soon')}</p>
      </div>
    </div>
  );
}
