import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Check, Plus, ListChecks, ChevronDown, ChevronUp, Trash2, History, MinusCircle } from 'lucide-react';
import { useTodayTasks } from '@/hooks/useTodayTasks';
import { useStreaks } from '@/hooks/useStreaks';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TaskItem } from '@/lib/companionTypes';
import { cn } from '@/lib/utils';

const STREAK_SUMMARY: { category: 'water' | 'meds' | 'plant' | 'tasks'; emoji: string; key: string }[] = [
  { category: 'water', emoji: '💧', key: 'streak_water' },
  { category: 'meds', emoji: '🔥', key: 'streak_meds' },
  { category: 'plant', emoji: '🌿', key: 'streak_plant' },
  { category: 'tasks', emoji: '✨', key: 'streak_tasks' },
];

export default function WhatToDoToday() {
  const { t } = useLanguage();
  const { activeTasks, completedTasks, completeTask, uncompleteTask, addManualTask, history, deleteHistoryEntry } = useTodayTasks();
  const { getStreak } = useStreaks();
  const [isExpanded, setIsExpanded] = useLocalStorage('companion_todo_expanded', true);

  const [newTask, setNewTask] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const activeStreaks = STREAK_SUMMARY.filter(s => getStreak(s.category).currentCount >= 1);

  function add() {
    if (!newTask.trim()) return;
    addManualTask(newTask, 'normal');
    setNewTask('');
  }

  function TaskRow({ task, done }: { task: TaskItem; done: boolean }) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 py-2 px-2.5 rounded-xl border transition-all',
          done ? 'border-[hsl(35_25%_90%)] bg-[hsl(40_20%_98%)] opacity-60' : 'border-[hsl(35_25%_88%)] bg-white',
          task.priority === 'urgent' && !done && 'border-l-2 border-l-[hsl(0_70%_60%)]',
          task.priority === 'high' && !done && 'border-l-2 border-l-[hsl(35_80%_60%)]',
        )}
        data-testid={`todo-${task.key}`}
      >
        <button
          onClick={() => (done ? uncompleteTask(task) : completeTask(task))}
          className={cn(
            'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90',
            done ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white' : 'border-[hsl(35_25%_80%)] text-transparent hover:border-[hsl(150_30%_55%)]',
          )}
          aria-label={done ? t('mark_undone') : t('mark_done')}
        >
          <Check size={13} strokeWidth={3} />
        </button>
        <span className="text-base shrink-0">{task.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium leading-tight truncate', done ? 'line-through text-muted-foreground' : 'text-foreground')}>
            {task.title}
          </p>
          {task.subtitle && <p className="text-[11px] text-muted-foreground truncate">{task.subtitle}</p>}
        </div>
      </div>
    );
  }

  const totalTasks = activeTasks.length + completedTasks.length;

  return (
    <Card className="border-[hsl(35_25%_88%)] shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-[var(--brand-accent)] transition-colors"
          >
            <ListChecks size={15} className="text-[var(--brand-accent)]" />
            {t('what_to_do_today')}
            {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>
          <button
            onClick={() => setShowHistory(v => !v)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <History size={12} /> {t('history')}
          </button>
        </div>

        {/* Collapsed summary */}
        {!isExpanded && (
          <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
            <span>{activeTasks.length} {t('remaining')}</span>
            {completedTasks.length > 0 && <span className="text-[var(--brand-accent)]">{completedTasks.length} {t('done').toLowerCase()}</span>}
          </div>
        )}

        {isExpanded && (
          <>
            {/* Streak summary */}
            {activeStreaks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {activeStreaks.map(s => (
                  <span key={s.category} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(40_70%_94%)] text-[hsl(35_50%_40%)]">
                    {s.emoji} {getStreak(s.category).currentCount}-{t('day_streak')}
                  </span>
                ))}
              </div>
            )}

            {/* History view */}
            {showHistory ? (
              <div className="space-y-1.5">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">{t('no_history')}</p>
                ) : (
                  history.slice(0, 30).map(h => (
                    <div key={`${h.date}:${h.key}`} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[hsl(40_20%_98%)]">
                      <span className="text-sm">{h.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate line-through opacity-70">{h.title}</p>
                        <p className="text-[10px] text-muted-foreground">{h.date}</p>
                      </div>
                      <button onClick={() => deleteHistoryEntry(h.date, h.key)} className="text-muted-foreground hover:text-red-400 p-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {/* Active tasks */}
                <div className="space-y-1.5">
                  {activeTasks.length === 0 && completedTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">{t('all_clear_today')}</p>
                  )}
                  {activeTasks.map(task => <TaskRow key={task.key} task={task} done={false} />)}
                  {activeTasks.length === 0 && completedTasks.length > 0 && (
                    <p className="text-xs text-[var(--brand-accent)] text-center py-2 font-medium">{t('all_done_today')}</p>
                  )}
                </div>

                {/* Completed (collapsible) */}
                {completedTasks.length > 0 && (
                  <div>
                    <button onClick={() => setShowDone(v => !v)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      {showDone ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      {t('done')} ({completedTasks.length})
                    </button>
                    {showDone && (
                      <div className="space-y-1.5 mt-2">
                        {completedTasks.map(task => <TaskRow key={task.key} task={task} done />)}
                      </div>
                    )}
                  </div>
                )}

                {/* Add manual task */}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && add()}
                    placeholder={t('add_task_placeholder')}
                    className="h-9 text-sm"
                    data-testid="input-manual-task"
                  />
                  <button
                    onClick={add}
                    disabled={!newTask.trim()}
                    className="shrink-0 h-9 w-9 rounded-lg bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] flex items-center justify-center disabled:opacity-40 active:scale-95 transition-all"
                    aria-label={t('add')}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
