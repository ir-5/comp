import { ActiveTimer } from '@/hooks/useTimers';
import { cn } from '@/lib/utils';
import { Pause, Play, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface TimerCardProps {
  timer: ActiveTimer;
  displayTime: string;
  progress: number;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
  onTogglePrioritize?: (id: string) => void;
  canPrioritize?: boolean;
  showPrioritizeButton?: boolean;
  dark?: boolean;
}

export default function TimerCard({
  timer,
  displayTime,
  progress,
  onPause,
  onResume,
  onCancel,
  onDismiss,
  onTogglePrioritize,
  canPrioritize = true,
  showPrioritizeButton = false,
  dark = false,
}: TimerCardProps) {
  const isPaused = timer.pausedAt !== null;
  const isCompleted = timer.completed;

  return (
    <div
      data-testid={`timer-card-${timer.id}`}
      className={cn(
        'p-3 rounded-xl border transition-all duration-200',
        isCompleted
          ? 'border-[var(--brand-primary)] bg-[hsl(150_40%_97%)]'
          : timer.isPrioritized
          ? 'border-[hsl(220_40%_55%)] bg-[hsl(220_60%_96%)]'
          : 'border-[hsl(35_25%_88%)] bg-white'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {showPrioritizeButton && onTogglePrioritize && !isCompleted && (
            <button
              onClick={() => onTogglePrioritize(timer.id)}
              disabled={!timer.isPrioritized && !canPrioritize}
              title={timer.isPrioritized ? 'Remove from Home' : !canPrioritize ? 'Max 2 pinned timers' : 'Pin to Home screen'}
              className={cn(
                'shrink-0 transition-colors p-0.5 rounded',
                timer.isPrioritized
                  ? 'text-[hsl(220_40%_55%)]'
                  : canPrioritize
                  ? 'text-muted-foreground hover:text-[hsl(220_40%_55%)]'
                  : 'text-muted-foreground/30 cursor-not-allowed'
              )}
            >
              <Star size={14} fill={timer.isPrioritized ? 'currentColor' : 'none'} />
            </button>
          )}
          <p className="text-sm font-semibold text-foreground truncate">{timer.label}</p>
          {timer.isPrioritized && !isCompleted && (
            <span className="shrink-0 text-[10px] font-medium text-[hsl(220_40%_55%)] bg-[hsl(220_60%_92%)] px-1.5 py-0.5 rounded-full">
              Home
            </span>
          )}
        </div>
        {isCompleted ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(timer.id)}
            data-testid={`btn-dismiss-timer-${timer.id}`}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={14} />
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCancel(timer.id)}
            data-testid={`btn-cancel-timer-${timer.id}`}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X size={14} />
          </Button>
        )}
      </div>

      {isCompleted ? (
        <p className="text-sm font-medium text-[hsl(150_30%_40%)]">
          Done! Great work! 🎉
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-2">
            <span className={cn(
              'text-2xl font-mono font-bold tabular-nums',
              timer.isPrioritized ? 'text-[hsl(220_40%_45%)]' : 'text-foreground'
            )}>
              {displayTime}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => isPaused ? onResume(timer.id) : onPause(timer.id)}
              data-testid={`btn-pause-resume-${timer.id}`}
              className={cn(
                'h-8 w-8 p-0',
                timer.isPrioritized
                  ? 'border-[hsl(220_40%_70%)] hover:bg-[hsl(220_60%_92%)]'
                  : 'border-[hsl(35_25%_88%)]'
              )}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </Button>
          </div>
          <Progress
            value={progress}
            className={cn(
              'h-1.5',
              timer.isPrioritized
                ? '[&>div]:bg-[hsl(220_40%_55%)] [&>div]:transition-all'
                : '[&>div]:bg-[hsl(150_40%_60%)] [&>div]:transition-all'
            )}
          />
          {isPaused && (
            <p className="text-xs text-muted-foreground mt-1">Paused — ready when you are</p>
          )}
        </>
      )}
    </div>
  );
}
