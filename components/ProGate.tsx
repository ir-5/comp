import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock } from 'lucide-react';

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function useIsPro() {
  const [isPro] = useLocalStorage<boolean>('companion_is_pro', false);
  return isPro;
}

export default function ProGate({ children, feature = 'this feature' }: ProGateProps) {
  const [isPro, setIsPro] = useLocalStorage<boolean>('companion_is_pro', false);

  if (isPro) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--brand-secondary)] flex items-center justify-center mb-4">
        <Lock size={28} className="text-[hsl(220_40%_55%)]" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">Pro Feature</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-[260px]">
        Unlock {feature} and all customization tools with Companion Pro.
      </p>
      <Button
        onClick={() => setIsPro(true)}
        className="gap-2 bg-gradient-to-r from-[hsl(220_40%_55%)] to-[var(--brand-accent)] text-white border-0 rounded-xl px-6 h-11 text-sm font-semibold hover:opacity-90"
      >
        <Sparkles size={16} />
        Try Pro for Free
      </Button>
      <p className="text-xs text-muted-foreground mt-3">No credit card needed during beta</p>
    </div>
  );
}
