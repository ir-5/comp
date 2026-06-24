import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLanguage } from '@/contexts/LanguageContext';

export function useProPopup() {
  const [, setIsPro] = useLocalStorage<boolean>('companion_is_pro', false);
  const { t } = useLanguage();

  function showProPopup() {
    toast(t('pro_popup_title'), {
      description: t('pro_popup_desc'),
      duration: 5000,
      action: {
        label: t('pro_popup_cta'),
        onClick: () => setIsPro(true),
      },
      style: {
        background: 'var(--brand-surface)',
        border: '1px solid var(--brand-primary)',
        color: '#4A4A4A',
        borderRadius: '12px',
        fontSize: '14px',
      },
    });
  }

  return { showProPopup };
}

interface ProLockedProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ProLocked({ children, className = '', onClick }: ProLockedProps) {
  const [isPro] = useLocalStorage<boolean>('companion_is_pro', false);
  const { showProPopup } = useProPopup();

  if (isPro) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={`opacity-50 cursor-not-allowed select-none ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showProPopup();
      }}
    >
      {children}
    </div>
  );
}
