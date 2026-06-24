import { Star, Trash2, Check, ChevronDown, ChevronUp, Minus, CheckSquare } from 'lucide-react';
import { SavedNote } from '@/lib/companionTypes';
import { NOTE_BG, styleClasses } from '@/lib/noteStyles';
import { useLanguage } from '@/contexts/LanguageContext';
import { timeAgo, cn } from '@/lib/utils';

// Markdown-lite renderer; colors inherit from the styled container.
function renderStyledContent(content: string) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) return <p key={i} className="font-bold">{line.slice(2)}</p>;
        if (line.startsWith('## ')) return <p key={i} className="font-semibold">{line.slice(3)}</p>;
        const todo = line.match(/^\[( |x)\]\s+(.*)/i);
        if (todo) {
          const checked = todo[1].toLowerCase() === 'x';
          return (
            <div key={i} className="flex items-start gap-2">
              <span className={cn('mt-0.5 shrink-0', checked ? 'text-[var(--brand-accent)]' : 'opacity-60')}>
                {checked ? <CheckSquare size={13} /> : <span className="inline-block w-3 h-3 rounded border border-current mt-0.5" />}
              </span>
              <span className={cn(checked && 'line-through opacity-60')}>{todo[2]}</span>
            </div>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2">
              <Minus size={10} className="mt-1 shrink-0 opacity-60" />
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

interface Props {
  note: SavedNote;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStar: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
}

export default function SavedNoteCard({ note, expanded, onToggleExpand, onToggleStar, onToggleDone, onDelete }: Props) {
  const { t } = useLanguage();
  const done = !!note.completedAt;
  const bg = NOTE_BG[note.style?.noteColor ?? 'default'];
  const firstLine = note.content.split('\n').find(l => l.trim())?.replace(/^[#\-*\s]+|\[( |x)\]/gi, '').trim() ?? '';

  const priorityBadge = note.priority === 'urgent'
    ? { label: t('priority_urgent'), cls: 'bg-red-100 text-red-600' }
    : note.priority === 'high'
      ? { label: t('priority_high'), cls: 'bg-amber-100 text-amber-600' }
      : null;

  return (
    <div
      className={cn(
        'rounded-xl border transition-all',
        done ? 'border-[hsl(35_25%_90%)] opacity-60' : note.starred ? 'border-amber-200' : 'border-[hsl(35_25%_88%)]',
        bg?.class ?? 'bg-white',
      )}
      data-testid={`saved-note-${note.id}`}
    >
      <div className="flex items-start gap-2 p-3">
        {/* Tick */}
        <button
          onClick={onToggleDone}
          className={cn('shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all active:scale-90', done ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white' : 'border-[hsl(35_25%_75%)] text-transparent hover:border-[hsl(150_30%_55%)]')}
          aria-label={done ? t('mark_undone') : t('mark_done')}
          data-testid={`btn-note-done-${note.id}`}
        >
          <Check size={11} strokeWidth={3} />
        </button>

        {/* Title + meta (click to expand) */}
        <button onClick={onToggleExpand} className="flex-1 min-w-0 text-start">
          <div className="flex items-center gap-1.5">
            <p className={cn('text-sm font-semibold truncate', done ? 'line-through text-muted-foreground' : 'text-foreground')}>
              {note.title || t('untitled_note')}
            </p>
            {priorityBadge && <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0', priorityBadge.cls)}>{priorityBadge.label}</span>}
          </div>
          {!expanded && firstLine && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{firstLine}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(note.createdAt)}</p>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onToggleStar} className={cn('p-1 transition-colors', note.starred ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-400')} aria-label={t('pin_note')}>
            <Star size={13} fill={note.starred ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onToggleExpand} className="p-1 text-muted-foreground" aria-label={expanded ? t('collapse') : t('expand')}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-red-400" aria-label={t('delete')}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className={cn('px-3 pb-3 pt-0', styleClasses(note.style ?? {}), done && 'line-through')}>
          {renderStyledContent(note.content)}
        </div>
      )}
    </div>
  );
}
