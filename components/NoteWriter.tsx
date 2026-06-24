import { useState } from 'react';
import { Bold, Italic, Feather, Star, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useIsPro } from '@/components/ProGate';
import { useProPopup } from '@/components/ProPopup';
import { useLanguage } from '@/contexts/LanguageContext';
import { NoteStyle, NoteFont, TaskPriority } from '@/lib/companionTypes';
import { NOTE_BG, NOTE_TEXT, styleClasses } from '@/lib/noteStyles';
import { cn } from '@/lib/utils';

export interface NoteDraft {
  title: string;
  content: string;
  priority: TaskPriority;
  style: NoteStyle;
  starred: boolean;
}

const FONTS: { key: NoteFont; label: string; class: string }[] = [
  { key: 'sans', label: 'Aa', class: 'font-sans' },
  { key: 'serif', label: 'Aa', class: 'font-serif' },
  { key: 'rounded', label: 'Aa', class: 'font-sans tracking-tight' },
  { key: 'mono', label: 'Aa', class: 'font-mono' },
  { key: 'hand', label: 'Aa', class: 'font-serif italic' },
];

const SIZES: NonNullable<NoteStyle['fontSize']>[] = ['sm', 'base', 'lg', 'xl'];

export default function NoteWriter({ onSave, onCancel }: { onSave: (d: NoteDraft) => void; onCancel: () => void }) {
  const { t, lang } = useLanguage();
  const isPro = useIsPro();
  const { showProPopup } = useProPopup();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [starred, setStarred] = useState(false);
  const [style, setStyle] = useState<NoteStyle>({ font: 'sans', fontSize: 'base', noteColor: 'default', fontColor: 'default' });

  // Free users: bold, italic, pin, normal priority. Everything else is Pro.
  function gate(action: () => void) {
    if (!isPro) { showProPopup(); return; }
    action();
  }

  function setStylePart(part: Partial<NoteStyle>) {
    setStyle(prev => ({ ...prev, ...part }));
  }

  const ProBadge = () => (
    <span className="ms-0.5 inline-flex items-center gap-0.5 text-[8px] text-[hsl(220_40%_55%)] font-semibold">
      <Lock size={7} /> Pro
    </span>
  );

  const bgClass = NOTE_BG[style.noteColor ?? 'default']?.class ?? 'bg-white';

  function handleSave() {
    if (!content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), priority, style, starred });
  }

  return (
    <div className="p-3 bg-[hsl(40_20%_97%)] rounded-xl border border-[hsl(35_25%_88%)] space-y-2.5" data-testid="note-writer">
      <Input
        placeholder={t('note_title_optional')}
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="h-8 text-sm"
      />

      {/* Weight + pin row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setStylePart({ bold: !style.bold, light: false })}
          className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors', style.bold ? 'bg-[var(--brand-primary)] border-[hsl(150_30%_60%)] text-[var(--brand-accent-deep)]' : 'border-[hsl(35_25%_88%)] bg-white text-foreground hover:bg-[var(--brand-primary)]')}
          aria-label={t('bold')}
        >
          <Bold size={11} /> B
        </button>
        <button
          onClick={() => setStylePart({ italic: !style.italic })}
          className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors italic', style.italic ? 'bg-[var(--brand-primary)] border-[hsl(150_30%_60%)] text-[var(--brand-accent-deep)]' : 'border-[hsl(35_25%_88%)] bg-white text-foreground hover:bg-[var(--brand-primary)]')}
          aria-label={t('italic')}
        >
          <Italic size={11} /> I
        </button>
        <button
          onClick={() => gate(() => setStylePart({ light: !style.light, bold: false }))}
          className={cn('flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors font-light', style.light ? 'bg-[var(--brand-primary)] border-[hsl(150_30%_60%)] text-[var(--brand-accent-deep)]' : 'border-[hsl(35_25%_88%)] bg-white text-foreground hover:bg-[var(--brand-primary)]')}
          aria-label={t('light')}
        >
          <Feather size={11} /> {t('light')}{!isPro && <ProBadge />}
        </button>
        <button
          onClick={() => setStarred(v => !v)}
          className={cn('ms-auto flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors', starred ? 'bg-amber-100 border-amber-300 text-amber-600' : 'border-[hsl(35_25%_88%)] bg-white text-muted-foreground hover:border-amber-300')}
          aria-label={t('pin_note')}
        >
          <Star size={11} fill={starred ? 'currentColor' : 'none'} /> {t('pin')}
        </button>
      </div>

      {/* Font size + family */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground">{t('size')}</span>
        {SIZES.map(s => (
          <button
            key={s}
            onClick={() => gate(() => setStylePart({ fontSize: s }))}
            className={cn('px-1.5 py-0.5 rounded-md border text-[10px] transition-colors', style.fontSize === s ? 'bg-[var(--brand-secondary)] border-[hsl(220_50%_70%)] text-[hsl(220_30%_35%)] font-semibold' : 'border-[hsl(35_25%_88%)] bg-white text-muted-foreground')}
          >
            {s === 'sm' ? 'S' : s === 'base' ? 'M' : s === 'lg' ? 'L' : 'XL'}
          </button>
        ))}
        {!isPro && <ProBadge />}
        <span className="text-[10px] text-muted-foreground ms-1">{t('font')}</span>
        {FONTS.map(f => (
          <button
            key={f.key}
            onClick={() => gate(() => setStylePart({ font: f.key }))}
            className={cn('px-2 py-0.5 rounded-md border text-xs transition-colors', f.class, style.font === f.key ? 'bg-[var(--brand-secondary)] border-[hsl(220_50%_70%)] text-[hsl(220_30%_35%)]' : 'border-[hsl(35_25%_88%)] bg-white text-foreground')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground">{t('note_color')}</span>
        {Object.entries(NOTE_BG).map(([key, v]) => (
          <button
            key={key}
            onClick={() => gate(() => setStylePart({ noteColor: key }))}
            className={cn('w-5 h-5 rounded-full border-2 transition-all', (style.noteColor ?? 'default') === key ? 'border-[var(--brand-accent)] scale-110' : 'border-[hsl(35_25%_85%)]')}
            style={{ backgroundColor: v.dot }}
            aria-label={v.label}
          />
        ))}
        {!isPro && <ProBadge />}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground">{t('text_color')}</span>
        {Object.entries(NOTE_TEXT).map(([key, v]) => (
          <button
            key={key}
            onClick={() => gate(() => setStylePart({ fontColor: key }))}
            className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all', (style.fontColor ?? 'default') === key ? 'border-[var(--brand-accent)] scale-110' : 'border-[hsl(35_25%_85%)]')}
            aria-label={v.label}
          >
            <span className="text-[11px] font-bold" style={{ color: v.dot }}>A</span>
          </button>
        ))}
        {!isPro && <ProBadge />}
      </div>

      {/* Priority */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground">{t('priority')}</span>
        {(['normal', 'high', 'urgent'] as TaskPriority[]).map(p => (
          <button
            key={p}
            onClick={() => { if (p !== 'normal' && !isPro) { showProPopup(); return; } setPriority(p); }}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded-full border transition-all',
              priority === p
                ? p === 'urgent' ? 'bg-red-100 border-red-300 text-red-600 font-bold'
                  : p === 'high' ? 'bg-amber-100 border-amber-300 text-amber-600 font-bold'
                  : 'bg-[var(--brand-primary)] border-[hsl(150_30%_60%)] text-[var(--brand-accent-deep)] font-bold'
                : 'border-[hsl(35_25%_88%)] text-muted-foreground hover:border-[hsl(150_30%_60%)]',
            )}
          >
            {p === 'normal' ? t('priority_normal') : p === 'high' ? t('priority_high') : t('priority_urgent')}
            {p !== 'normal' && !isPro && <ProBadge />}
          </button>
        ))}
      </div>

      {/* Body */}
      <Textarea
        placeholder={lang === 'ar'
          ? 'اكتب ملاحظتك...\n\nالتنسيق:\n- عنصر → نقطة\n[ ] مهمة → مربع\n# عنوان → رأس'
          : 'Write your note...\n\nFormatting:\n- Item → bullet\n[ ] Task → checkbox\n# Heading'}
        value={content}
        onChange={e => setContent(e.target.value)}
        className={cn('min-h-[120px] resize-none border-[hsl(35_25%_88%)] rounded-xl', bgClass, styleClasses(style))}
        autoFocus
      />

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={!content.trim()} data-testid="btn-save-note" className="h-7 text-xs bg-[var(--brand-primary)] text-[var(--brand-accent-deep)] hover:bg-[var(--brand-accent-soft)] border-0">{t('save')}</Button>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">{t('cancel')}</Button>
      </div>
    </div>
  );
}
