import { useStreaks } from '@/hooks/useStreaks';
import { StreakCategory } from '@/lib/companionTypes';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  category: StreakCategory;
  emoji: string;
  className?: string;
}

// Small, positive, non-punitive streak pill. Shows current momentum.
export default function StreakBadge({ category, emoji, className }: StreakBadgeProps) {
  const { getStreak } = useStreaks();
  const rec = getStreak(category);
  if (rec.currentCount < 1) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[hsl(40_70%_94%)] text-[hsl(35_50%_40%)]',
        className,
      )}
    >
      {emoji} {rec.currentCount}
    </span>
  );
}
