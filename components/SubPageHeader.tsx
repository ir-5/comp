import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  title: string;
  backTo?: string;
  right?: React.ReactNode;
}

export default function SubPageHeader({ title, backTo = '/settings', right }: Props) {
  const [, navigate] = useLocation();
  const { isRTL, t } = useLanguage();
  const Icon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="sticky top-0 z-40 flex items-center gap-2 px-3 py-3 bg-background/95 backdrop-blur-sm border-b border-[hsl(35_25%_88%)]">
      <button
        onClick={() => navigate(backTo)}
        aria-label={t('back')}
        data-testid="btn-back"
        className="p-1.5 rounded-full hover:bg-muted -ms-1 text-foreground"
      >
        <Icon size={22} />
      </button>
      <h1 className="text-lg font-bold text-foreground flex-1 truncate">{title}</h1>
      {right}
    </div>
  );
}
