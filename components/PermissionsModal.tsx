import { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  serviceName: string;
  serviceIcon: string;
  permissions: string[];
  description: string;
}

export default function PermissionsModal({
  isOpen,
  onClose,
  onAllow,
  serviceName,
  serviceIcon,
  permissions,
  description,
}: PermissionsModalProps) {
  const { t, dir } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-[var(--brand-surface)] rounded-t-2xl p-5 pb-8 shadow-xl"
        dir={dir}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(220_60%_96%)] flex items-center justify-center text-xl">
              {serviceIcon}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{t('permission_title')}</p>
              <p className="text-xs text-muted-foreground">{serviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 bg-[hsl(220_50%_97%)] rounded-xl border border-[var(--brand-secondary)] mb-4">
          <div className="flex items-start gap-2">
            <Shield size={14} className="text-[hsl(220_40%_55%)] mt-0.5 shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{description}</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          This will allow:
        </p>
        <ul className="space-y-1.5 mb-5">
          {permissions.map((perm, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="text-[var(--brand-accent)] mt-0.5 shrink-0">✓</span>
              {perm}
            </li>
          ))}
        </ul>

        <div className="flex gap-3">
          <Button
            onClick={onAllow}
            className="flex-1 h-11 bg-[var(--brand-accent)] text-white border-0 hover:bg-[hsl(150_30%_38%)] rounded-xl font-semibold"
          >
            {t('permission_allow')}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-11 border-[hsl(35_25%_88%)] rounded-xl"
          >
            {t('permission_deny')}
          </Button>
        </div>
      </div>
    </div>
  );
}
