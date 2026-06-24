import { useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { todayStr, cn } from '@/lib/utils';

interface MoodData {
  date: string;
  mood: string;
  timestamp: number;
}

const MOODS = [
  { key: 'tired', emoji: '😴', label: 'Tired', affirmation: "It's okay to be tired — you're doing great just by showing up." },
  { key: 'stressed', emoji: '😰', label: 'Stressed', affirmation: "Stress means you care. Take a breath — you've got this, one step at a time." },
  { key: 'okay', emoji: '😐', label: 'Okay', affirmation: "Okay is perfectly fine! Every day doesn't have to be amazing." },
  { key: 'good', emoji: '🙂', label: 'Good', affirmation: "That's wonderful! You're doing something right today." },
  { key: 'great', emoji: '✨', label: 'Great', affirmation: "Love to hear it! You're absolutely glowing today." },
];

export default function MoodSelector({ customQuestion }: { customQuestion?: string }) {
  const [moodData, setMoodData] = useLocalStorage<MoodData | null>('companion_mood', null);
  const [showAffirmation, setShowAffirmation] = useState(false);

  const isToday = moodData?.date === todayStr();
  const currentMood = isToday ? MOODS.find(m => m.key === moodData?.mood) : null;

  function selectMood(mood: typeof MOODS[0]) {
    setMoodData({ date: todayStr(), mood: mood.key, timestamp: Date.now() });
    setShowAffirmation(true);
    setTimeout(() => setShowAffirmation(false), 4000);
  }

  const affirmation = MOODS.find(m => m.key === moodData?.mood)?.affirmation;

  return (
    <div data-testid="mood-selector">
      <p className="text-sm font-medium text-muted-foreground mb-3">{customQuestion || 'How are you feeling today?'}</p>
      <div className="flex gap-2">
        {MOODS.map(mood => (
          <button
            key={mood.key}
            data-testid={`mood-btn-${mood.key}`}
            onClick={() => selectMood(mood)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all duration-200 active:scale-95',
              currentMood?.key === mood.key
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] shadow-sm'
                : 'border-[hsl(35_25%_88%)] bg-white hover:bg-[#f8f5f0]'
            )}
          >
            <span className="text-xl">{mood.emoji}</span>
            <span className="text-[10px] font-medium text-foreground/70">{mood.label}</span>
          </button>
        ))}
      </div>
      {showAffirmation && affirmation && (
        <div className="mt-3 p-3 bg-[var(--brand-secondary)] rounded-xl text-sm text-[hsl(220_30%_30%)] animate-in fade-in slide-in-from-bottom-2 duration-300">
          {affirmation}
        </div>
      )}
    </div>
  );
}
