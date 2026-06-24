import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
      <p className="text-muted-foreground mb-6">{t('page_not_found')}</p>
      <Button onClick={() => navigate('/')}>{t('go_home')}</Button>
    </div>
  );
}
