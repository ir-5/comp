import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Trash2, Clock, BookOpen, ChevronDown, ChevronUp,
  HelpCircle, Mail, Plus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useStreaks } from '@/hooks/useStreaks';
import { useTaskCompletions } from '@/hooks/useTaskCompletions';
import { parseNaturalLanguage, formatEventSummary, ParsedEvent } from '@/lib/nlpParser';
import { SavedNote, todayKey } from '@/lib/companionTypes';
import { timeAgo, todayStr, uid, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsPro } from '@/components/ProGate';
import { useProPopup } from '@/components/ProPopup';
import NoteWriter, { NoteDraft } from '@/components/NoteWriter';
import SavedNoteCard from '@/components/SavedNoteCard';
import PermissionsModal from '@/components/PermissionsModal';

interface WaterData { date: string; count: number; goal: number; }
interface MedData { date: string; morning: boolean; afternoon: boolean; evening: boolean; medName: string; }
interface PlantData { id: string; name: string; frequencyDays: number; lastWatered: string; }
interface HealthData { steps: number; heartRate: number; calories: number; sleepHours: number; }

interface NoteHistoryItem {
  id: string;
  original: string;
  parsed: ParsedEvent[];
  createdAt: number;
  isQA?: boolean;
  qaAnswer?: string;
  isAction?: boolean;
  actionType?: string;
}

function normalizeNote(n: SavedNote): SavedNote {
  return {
    id: n.id,
    content: n.content ?? '',
    title: n.title ?? '',
    starred: !!n.starred,
    priority: n.priority ?? 'normal',
    style: n.style ?? {},
    completedAt: n.completedAt ?? null,
    createdAt: n.createdAt ?? Date.now(),
  };
}

const QUICK_FILLS = [
  { label: '+ Take vitamins', text: 'remind me to take vitamins daily at 9am' },
  { label: '+ Drink water', text: 'remind me to drink water every morning at 8am' },
  { label: '+ Park reminder', text: 'remind me to check where I parked at 5pm' },
];

// Detect if text is a question
function detectQA(text: string): 'steps' | 'water' | 'meds' | 'calories' | 'sleep' | null {
  const l = text.toLowerCase();
  if (/how many steps|step.*left|خطوات|كم خطوة/.test(l)) return 'steps';
  if (/how much water|how many cup|كم كأس|كم مل|شربت.*كم/.test(l)) return 'water';
  if (/did i take|took.*med|هل أخذت.*دواء|أخذت.*دواء/.test(l)) return 'meds';
  if (/calorie|how many cal|سعرات/.test(l)) return 'calories';
  if (/how.*sleep|كم ساعة.*نوم/.test(l)) return 'sleep';
  return null;
}

// Detect app state actions
type ActionType = 'water' | 'meds' | 'plant' | 'track' | null;
function detectAction(text: string): { type: ActionType; amount?: number; item?: string } {
  const l = text.toLowerCase();

  // Water: "drank 2 cups", "drunk 3 glasses", "شربت كأسين"
  const waterMatch = l.match(/(?:drank?|drunk|had|شربت?)\s*(\d+(?:\.\d+)?)\s*(?:cup|glass|كأس|كوب)/i);
  if (waterMatch) return { type: 'water', amount: Math.round(parseFloat(waterMatch[1])) };
  if (/drank?\s+a\s+cup|drank?\s+water|شربت\s+ماء|شربت\s+كأس/i.test(l)) return { type: 'water', amount: 1 };

  // Meds: "took my meds", "took my medicine", "أخذت دوائي"
  if (/took\s+my?\s+med|took\s+my?\s+pill|took\s+my?\s+vitam|took\s+medicine|أخذت\s+دواء|تناولت\s+دواء/i.test(l)) {
    return { type: 'meds' };
  }

  // Plants: "watered the plant", "watered my plants", "سقيت"
  if (/water(?:ed)?\s+(?:the|my)?\s*plant|سقيت\s+(?:الزرع|النبات)|سقيت\s+النبت/i.test(l)) {
    return { type: 'plant' };
  }

  // Tracker: "track my keys", "track my bag", "remember where I put my wallet"
  const trackMatch = l.match(/track\s+(?:my\s+)?(.+?)(?:\s+(?:for|after)\s+\d+\s+\w+)?$/) ||
    l.match(/(?:تتبع|تتبعي|اتتبع)\s+(?:ال)?(.+)/);
  if (trackMatch) {
    const item = trackMatch[1].replace(/^(my\s+|ال)/i, '').trim();
    if (item.length > 0 && item.length < 40) return { type: 'track' as ActionType, item };
  }

  return { type: null };
}

function buildQAAnswer(qaType: string, water: WaterData, meds: MedData, health: HealthData, t: (k: string) => string): string {
  if (qaType === 'steps') {
    const left = Math.max(0, 10000 - health.steps);
    if (left === 0) return t('steps_done');
    return `${left.toLocaleString()} ${t('steps_left')} ⭐️`;
  }
  if (qaType === 'water') {
    const count = water.date === todayStr() ? water.count : 0;
    const goal = water.goal ?? 8;
    const left = Math.max(0, goal - count);
    if (left === 0) return "You've hit your water goal today! 💧 Great job!";
    return `You've had ${count} cup${count !== 1 ? 's' : ''} today — ${left} more to go! 💧`;
  }
  if (qaType === 'meds') {
    if (meds.date !== todayStr()) return "I don't have today's meds logged yet. Tap below to check them off! 💊";
    const done = [meds.morning, meds.afternoon, meds.evening].filter(Boolean).length;
    if (done === 3) return "All three doses done today! Great work 💊✨";
    return `${done}/3 doses done today. ${3 - done} more to go! 💊`;
  }
  if (qaType === 'calories') {
    return `You've burned about ${health.calories.toLocaleString()} kcal today 🔥`;
  }
  if (qaType === 'sleep') {
    return `You got ${health.sleepHours}h of sleep last night ${health.sleepHours >= 7 ? "— that's great! 🌙" : "— try to get 7-9h tonight! 🌙"}`;
  }
  return 'Let me look into that for you! ✨';
}

const COMMANDS = [
  { emoji: '💧', en: '"drank 2 cups" or "drank a cup"', ar: '"شربت كأسين" أو "شربت كأساً"' },
  { emoji: '💊', en: '"took my meds" or "took my medicine"', ar: '"أخذت دوائي" أو "تناولت دواء"' },
  { emoji: '🌿', en: '"watered the plant" or "watered my plants"', ar: '"سقيت النبات" أو "سقيت الزرع"' },
  { emoji: '📅', en: '"dentist next Tuesday at 3pm"', ar: '"طبيب الأسنان الثلاثاء الساعة 3"' },
  { emoji: '⏰', en: '"remind me to take vitamins daily at 9am"', ar: '"ذكرني أتناول الفيتامينات يومياً الساعة 9"' },
  { emoji: '❓', en: '"how many steps left?" or "how much water did I drink?"', ar: '"كم خطوة متبقية؟" أو "كم كأس شربت؟"' },
  { emoji: '🔍', en: '"track my keys" / "track my bag" / "track my wallet"', ar: '"تتبع مفاتيحي" / "تتبع حقيبتي" / "تتبع محفظتي"' },
];

const EMAIL_PROVIDERS = [
  { key: 'google', icon: '📧', name: 'Google Gmail', perms: ['Read email headers and subjects', 'See sender and date', 'Never read email body without permission'] },
  { key: 'microsoft', icon: '📮', name: 'Microsoft Outlook', perms: ['Read Outlook inbox headers', 'See flagged/important emails', 'Never modify or send emails'] },
  { key: 'apple', icon: '🍎', name: 'Apple Mail', perms: ['Read Mail inbox summaries', 'See VIP sender list', 'Never read full email content'] },
];

export default function Note() {
  const { t, lang } = useLanguage();
  const isPro = useIsPro();
  const { showProPopup } = useProPopup();
  const [, navigate] = useLocation();

  const [input, setInput] = useState('');
  const [events, setEvents] = useLocalStorage<ParsedEvent[]>('companion_events', []);
  const [history, setHistory] = useLocalStorage<NoteHistoryItem[]>('companion_notes_history', []);
  const [water, setWater] = useLocalStorage<WaterData>('companion_water', { date: todayStr(), count: 0, goal: 8 });
  const [meds, setMeds] = useLocalStorage<MedData>('companion_meds', { date: todayStr(), morning: false, afternoon: false, evening: false, medName: '' });
  const [plants, setPlants] = useLocalStorage<PlantData[]>('companion_plants', []);
  const [health] = useLocalStorage<{ steps: number; heartRate: number; calories: number; sleepHours: number; lastUpdated: number }>('companion_health', { steps: 4280, heartRate: 72, calories: 1420, sleepHours: 7.2, lastUpdated: Date.now() });
  const [savedNotes, setSavedNotes] = useLocalStorage<SavedNote[]>('companion_saved_notes', []);
  const [connectedEmails, setConnectedEmails] = useLocalStorage<Record<string, boolean>>('companion_connected_emails', {});

  const { markComplete, undoComplete } = useStreaks();
  const { isDone, toggle: toggleCompletion } = useTaskCompletions();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const [showOlderNotes, setShowOlderNotes] = useState(false);
  const [showNewNote, setShowNewNote] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [emailPermModal, setEmailPermModal] = useState<{ key: string; name: string; icon: string; perms: string[] } | null>(null);

  // Listen for quick note from Home
  useEffect(() => {
    function handleQuickNote() {
      const val = sessionStorage.getItem('companion_quick_note');
      if (val) {
        setInput(val);
        sessionStorage.removeItem('companion_quick_note');
      }
    }
    window.addEventListener('companion-quick-note', handleQuickNote);
    return () => window.removeEventListener('companion-quick-note', handleQuickNote);
  }, []);

  function handleParse() {
    const text = input.trim();
    if (!text) return;
    setIsProcessing(true);

    setTimeout(() => {
      // Q&A detection
      const qaType = detectQA(text);
      if (qaType) {
        const answer = buildQAAnswer(qaType, water, meds, health, t);
        const historyItem: NoteHistoryItem = {
          id: uid(),
          original: text,
          parsed: [],
          createdAt: Date.now(),
          isQA: true,
          qaAnswer: answer,
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 20));
        toast(answer, { duration: 5000 });
        setInput('');
        setIsProcessing(false);
        return;
      }

      // Action detection (water / meds / plant / track)
      const action = detectAction(text);
      if (action.type) {
        // Track command: navigate to /tracker with item pre-filled
        if (action.type === 'track') {
          const item = (action as { type: 'track'; item?: string }).item ?? '';
          if (item) sessionStorage.setItem('companion_track_item', item);
          toast(`🔍 Tracking your ${item || 'item'} — opening Tracker!`, { duration: 3000 });
          setInput('');
          setIsProcessing(false);
          setTimeout(() => navigate('/tracker'), 600);
          return;
        }
        let actionMsg = '';
        if (action.type === 'water' && action.amount) {
          const today = todayStr();
          const currentCount = water.date === today ? water.count : 0;
          setWater(prev => ({ ...prev, date: today, count: currentCount + action.amount! }));
          actionMsg = `💧 Added ${action.amount} cup${action.amount !== 1 ? 's' : ''} of water! (${currentCount + action.amount!}/${water.goal ?? 8} today)`;
        } else if (action.type === 'meds') {
          const today = todayStr();
          const h = new Date().getHours();
          if (h < 12) {
            setMeds(prev => ({ ...prev, date: today, morning: true }));
            actionMsg = '💊 Morning meds marked as taken!';
          } else if (h < 17) {
            setMeds(prev => ({ ...prev, date: today, afternoon: true }));
            actionMsg = '💊 Afternoon meds marked as taken!';
          } else {
            setMeds(prev => ({ ...prev, date: today, evening: true }));
            actionMsg = '💊 Evening meds marked as taken!';
          }
        } else if (action.type === 'plant') {
          const today = todayStr();
          setPlants(prev => prev.map(p => ({ ...p, lastWatered: today })));
          actionMsg = '🌿 All plants marked as watered today!';
        }
        const historyItem: NoteHistoryItem = {
          id: uid(),
          original: text,
          parsed: [],
          createdAt: Date.now(),
          isAction: true,
          actionType: action.type ?? undefined,
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 20));
        toast(actionMsg, { duration: 4000 });
        setInput('');
        setIsProcessing(false);
        return;
      }

      // Standard event parsing
      const parsed = parseNaturalLanguage(text);
      setEvents(prev => [...prev, ...parsed]);
      const historyItem: NoteHistoryItem = {
        id: uid(),
        original: text,
        parsed,
        createdAt: Date.now(),
      };
      setHistory(prev => [historyItem, ...prev].slice(0, 20));
      parsed.forEach(event => {
        toast(formatEventSummary(event), { duration: 4000 });
      });
      if (parsed.length === 0) {
        toast(t('note_saved'), { duration: 3000 });
      }
      setInput('');
      setIsProcessing(false);
    }, 500);
  }

  function handleQuickAction(type: 'water' | 'meds' | 'plant') {
    const today = todayStr();
    if (type === 'water') {
      const currentCount = water.date === today ? water.count : 0;
      setWater(prev => ({ ...prev, date: today, count: currentCount + 1 }));
      toast(`💧 Added 1 cup! (${currentCount + 1}/${water.goal ?? 8} today)`, { duration: 3000 });
    } else if (type === 'meds') {
      const h = new Date().getHours();
      if (h < 12) {
        setMeds(prev => ({ ...prev, date: today, morning: true }));
        toast('💊 Morning meds marked as taken!', { duration: 3000 });
      } else if (h < 17) {
        setMeds(prev => ({ ...prev, date: today, afternoon: true }));
        toast('💊 Afternoon meds marked as taken!', { duration: 3000 });
      } else {
        setMeds(prev => ({ ...prev, date: today, evening: true }));
        toast('💊 Evening meds marked as taken!', { duration: 3000 });
      }
    } else if (type === 'plant') {
      setPlants(prev => prev.map(p => ({ ...p, lastWatered: today })));
      toast('🌿 All plants marked as watered!', { duration: 3000 });
    }
    setHistory(prev => [{
      id: uid(),
      original: type === 'water' ? 'drank a cup' : type === 'meds' ? 'took my meds' : 'watered plants',
      parsed: [],
      createdAt: Date.now(),
      isAction: true,
      actionType: type,
    }, ...prev].slice(0, 20));
  }

  function deleteHistoryItem(id: string) {
    const item = history.find(h => h.id === id);
    if (item && item.parsed.length > 0) {
      setEvents(prev => prev.filter(e => !item.parsed.some(p => p.id === e.id)));
    }
    setHistory(prev => prev.filter(h => h.id !== id));
  }

  function saveNote(draft: NoteDraft) {
    if (!draft.content.trim()) return;
    const note: SavedNote = {
      id: uid(),
      content: draft.content,
      title: draft.title || t('untitled_note'),
      starred: draft.starred,
      priority: draft.priority,
      style: draft.style,
      completedAt: null,
      createdAt: Date.now(),
    };
    setSavedNotes(prev => [note, ...prev.map(normalizeNote)]);
    setShowNewNote(false);
    toast(t('note_saved_toast'), { duration: 2000 });
  }

  function toggleStar(id: string) {
    setSavedNotes(prev => prev.map(normalizeNote).map(n => n.id === id ? { ...n, starred: !n.starred } : n));
  }

  function deleteSavedNote(id: string) {
    setSavedNotes(prev => prev.map(normalizeNote).filter(n => n.id !== id));
  }

  function toggleNoteDone(note: SavedNote) {
    const nowDone = !note.completedAt;
    setSavedNotes(prev => prev.map(normalizeNote).map(n => n.id === note.id ? { ...n, completedAt: nowDone ? Date.now() : null } : n));
    const today = todayKey();
    const key = `note:${note.id}`;
    const already = isDone(today, key);
    if (nowDone !== already) {
      toggleCompletion(today, key, { title: note.title || t('untitled_note'), category: 'note', source: 'note', refId: note.id, emoji: '📝' });
    }
    if (nowDone) markComplete('notes');
    else undoComplete('notes');
  }

  function toggleExpand(id: string) {
    setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function connectEmail(provider: typeof EMAIL_PROVIDERS[0]) {
    if (!isPro) {
      showProPopup();
      return;
    }
    setEmailPermModal({ key: provider.key, name: provider.name, icon: provider.icon, perms: provider.perms });
  }

  function confirmEmailConnect() {
    if (emailPermModal) {
      setConnectedEmails(prev => ({ ...prev, [emailPermModal.key]: true }));
      toast(`✓ ${emailPermModal.name} connected!`, { duration: 3000 });
      setEmailPermModal(null);
    }
  }

  function getTypeEmoji(type: string) {
    if (type === 'appointment') return '📅';
    if (type === 'plant') return '🌿';
    if (type === 'recurring') return '💊';
    return '⏰';
  }

  const allNotes = savedNotes.map(normalizeNote);
  const starredNotes = allNotes.filter(n => n.starred);
  const unstarredNotes = allNotes.filter(n => !n.starred);
  const recentUnstarred = unstarredNotes.slice(0, 3);
  const olderUnstarred = unstarredNotes.slice(3);
  const hasOlderNotes = olderUnstarred.length > 0;

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div className="pr-16">
        <h1 className="text-2xl font-bold text-foreground">{t('companion_note_title')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('companion_note_subtitle')}</p>
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-2">
        {[
          { type: 'water' as const, label: t('qa_drank_cup') },
          { type: 'meds' as const, label: t('qa_took_meds') },
          { type: 'plant' as const, label: t('qa_watered_plant') },
        ].map(qa => (
          <button
            key={qa.type}
            onClick={() => handleQuickAction(qa.type)}
            className="flex-1 py-2 px-1 rounded-xl border border-[hsl(35_25%_88%)] bg-white text-xs font-medium text-foreground hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all active:scale-95 text-center leading-snug"
          >
            {qa.label}
          </button>
        ))}
      </div>

      {/* Smart input */}
      <div className="space-y-3">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('note_placeholder')}
          data-testid="input-companion-note"
          className="min-h-[160px] text-base resize-none border-[hsl(35_25%_88%)] bg-white rounded-2xl shadow-sm focus-visible:ring-[var(--brand-primary)] leading-relaxed"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleParse();
          }}
        />
        <div className="flex gap-2 flex-wrap">
          {QUICK_FILLS.map(q => (
            <button
              key={q.label}
              onClick={() => setInput(prev => prev ? prev + '\n' + q.text : q.text)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--brand-primary)] bg-[var(--brand-primary)]/30 text-[hsl(150_20%_28%)] hover:bg-[var(--brand-primary)] transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>
        <Button
          onClick={handleParse}
          disabled={!input.trim() || isProcessing}
          data-testid="btn-parse-note"
          className="w-full h-12 text-base font-semibold bg-[var(--brand-primary)] text-[hsl(150_20%_20%)] hover:bg-[var(--brand-accent-soft)] border-0 shadow-sm rounded-xl gap-2 disabled:opacity-50"
        >
          <Sparkles size={18} />
          {isProcessing ? t('processing') : t('got_it')}
        </Button>
      </div>

      {/* Commands / Help */}
      <div className="rounded-xl border border-[hsl(35_25%_88%)] overflow-hidden">
        <button
          onClick={() => setShowCommands(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(40_20%_98%)] hover:bg-[hsl(40_20%_95%)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <HelpCircle size={14} className="text-[var(--brand-accent)]" />
            <p className="text-sm font-medium text-foreground">{t('commands_title')}</p>
          </div>
          {showCommands ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>
        {showCommands && (
          <div className="px-4 pb-3 pt-1 space-y-2 bg-[hsl(40_20%_98%)]">
            <p className="text-xs text-muted-foreground mb-2">{t('commands_subtitle')}</p>
            {COMMANDS.map((cmd, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-sm shrink-0">{cmd.emoji}</span>
                <p className="text-xs text-foreground">{lang === 'ar' ? cmd.ar : cmd.en}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent notes */}
      {history.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Clock size={14} className="text-muted-foreground" />
            {t('recent_notes')}
          </p>
          {history.map(item => (
            <div
              key={item.id}
              data-testid={`note-history-${item.id}`}
              className={cn(
                'p-3 rounded-xl border bg-white space-y-2',
                item.isQA ? 'border-[var(--brand-secondary)]' : item.isAction ? 'border-[var(--brand-primary)]' : 'border-[hsl(35_25%_88%)]'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground italic">"{item.original}"</p>
                  {item.isQA && item.qaAnswer && (
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <Sparkles size={11} className="text-[hsl(220_40%_55%)] mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-[hsl(220_30%_30%)]">{item.qaAnswer}</p>
                    </div>
                  )}
                  {item.isAction && (
                    <p className="text-xs text-[hsl(150_30%_40%)] mt-1 font-medium">
                      {item.actionType === 'water' && '💧 Water updated'}
                      {item.actionType === 'meds' && '💊 Meds updated'}
                      {item.actionType === 'plant' && '🌿 Plant care updated'}
                    </p>
                  )}
                  {!item.isQA && !item.isAction && item.parsed.map(event => (
                    <div key={event.id} className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{getTypeEmoji(event.type)}</span>
                      <span className="text-foreground font-medium">{event.title}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => deleteHistoryItem(item.id)} className="text-muted-foreground hover:text-foreground p-1 shrink-0 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">{timeAgo(item.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Saved Notes */}
      <Card className="border-[hsl(35_25%_88%)] shadow-sm">
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer"
          onClick={() => setShowSavedNotes(v => !v)}
        >
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <BookOpen size={14} className="text-[var(--brand-accent)]" />
            {t('saved_notes')}
            {savedNotes.length > 0 && (
              <span className="text-[10px] text-muted-foreground font-normal">({savedNotes.length})</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); setShowNewNote(true); setShowSavedNotes(true); }}
              className="text-[hsl(150_25%_40%)] text-xs flex items-center gap-1 hover:underline"
            >
              <Plus size={12} /> New
            </button>
            {showSavedNotes ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </div>
        </div>

        {showSavedNotes && (
          <CardContent className="pt-0 px-4 pb-4 space-y-3">
            {showNewNote && (
              <NoteWriter onSave={saveNote} onCancel={() => setShowNewNote(false)} />
            )}

            {starredNotes.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t('pinned')}</p>
                {starredNotes.map(note => (
                  <SavedNoteCard
                    key={note.id}
                    note={note}
                    expanded={!!expandedNotes[note.id]}
                    onToggleExpand={() => toggleExpand(note.id)}
                    onToggleStar={() => toggleStar(note.id)}
                    onToggleDone={() => toggleNoteDone(note)}
                    onDelete={() => deleteSavedNote(note.id)}
                  />
                ))}
              </div>
            )}

            {recentUnstarred.length > 0 && (
              <div className="space-y-2">
                {starredNotes.length > 0 && <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{t('recent_notes')}</p>}
                {recentUnstarred.map(note => (
                  <SavedNoteCard
                    key={note.id}
                    note={note}
                    expanded={!!expandedNotes[note.id]}
                    onToggleExpand={() => toggleExpand(note.id)}
                    onToggleStar={() => toggleStar(note.id)}
                    onToggleDone={() => toggleNoteDone(note)}
                    onDelete={() => deleteSavedNote(note.id)}
                  />
                ))}
              </div>
            )}

            {/* Older Notes expandable section */}
            {hasOlderNotes && (
              <div>
                <button
                  onClick={() => setShowOlderNotes(v => !v)}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock size={11} />
                    {t('older_notes')} ({olderUnstarred.length})
                  </span>
                  {showOlderNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {showOlderNotes && (
                  <div className="space-y-2 mt-1">
                    {olderUnstarred.map(note => (
                      <SavedNoteCard
                        key={note.id}
                        note={note}
                        expanded={!!expandedNotes[note.id]}
                        onToggleExpand={() => toggleExpand(note.id)}
                        onToggleStar={() => toggleStar(note.id)}
                        onToggleDone={() => toggleNoteDone(note)}
                        onDelete={() => deleteSavedNote(note.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {savedNotes.length === 0 && !showNewNote && (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">📓</p>
                <p className="text-sm text-muted-foreground">{t('no_saved_notes')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('saved_notes_hint')}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Email section (Pro-only) */}
      <Card className={cn('border-[hsl(35_25%_88%)] shadow-sm', !isPro && 'opacity-60')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Mail size={14} className="text-[hsl(220_40%_55%)]" />
              {t('email_section')}
            </p>
            {!isPro && (
              <span className="text-[10px] font-semibold text-[hsl(220_40%_55%)] bg-[hsl(220_60%_95%)] px-2 py-0.5 rounded-full">Pro</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t('email_pro_desc')}</p>
          <div className="space-y-2">
            {EMAIL_PROVIDERS.map(provider => (
              <div key={provider.key} className="flex items-center justify-between p-2.5 rounded-xl border border-[hsl(35_25%_90%)] bg-[hsl(40_20%_98%)]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{provider.icon}</span>
                  <p className="text-sm font-medium text-foreground">{provider.name}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => connectEmail(provider)}
                  className={cn(
                    'h-7 text-xs rounded-full px-3 border-0',
                    connectedEmails[provider.key]
                      ? 'bg-[var(--brand-primary)] text-[var(--brand-accent-deep)]'
                      : isPro
                        ? 'bg-[hsl(40_20%_90%)] text-foreground hover:bg-[var(--brand-primary)]'
                        : 'bg-[hsl(35_15%_88%)] text-muted-foreground cursor-not-allowed'
                  )}
                >
                  {connectedEmails[provider.key] ? '✓ Connected' : t('connect')}
                </Button>
              </div>
            ))}
          </div>
          {!isPro && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Tap to upgrade and unlock email sync →
            </p>
          )}
        </CardContent>
      </Card>

      {history.length === 0 && savedNotes.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-3xl mb-3">✏️</p>
          <p className="text-sm">Tell me anything — I'll update your app automatically.</p>
          <p className="text-xs mt-1">Or tap the quick buttons above!</p>
        </div>
      )}

      {/* Permissions Modal */}
      {emailPermModal && (
        <PermissionsModal
          isOpen={true}
          onClose={() => setEmailPermModal(null)}
          onAllow={confirmEmailConnect}
          serviceName={emailPermModal.name}
          serviceIcon={emailPermModal.icon}
          permissions={emailPermModal.perms}
          description={`Connecting to ${emailPermModal.name} will allow Companion to read your email headers and show you a prioritized summary. Companion will never send emails on your behalf or read full email content without your permission.`}
        />
      )}
    </div>
  );
}
