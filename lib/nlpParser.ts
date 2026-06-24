export type ParsedEventType = 'appointment' | 'reminder' | 'plant' | 'recurring';

export interface ParsedEvent {
  id: string;
  type: ParsedEventType;
  title: string;
  datetime: string | null;
  recurrence: string | null;
  original: string;
  createdAt: number;
}

const WEEKDAYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const WEEKDAY_SHORT = ['sun','mon','tue','wed','thu','fri','sat'];

function getWeekdayIndex(name: string): number {
  const lower = name.toLowerCase();
  let idx = WEEKDAYS.indexOf(lower);
  if (idx !== -1) return idx;
  idx = WEEKDAY_SHORT.findIndex(d => lower.startsWith(d));
  return idx;
}

function parseTime(text: string): { hour: number; minute: number } | null {
  const noonMatch = /\bnoon\b/.exec(text);
  if (noonMatch) return { hour: 12, minute: 0 };

  const midnightMatch = /\bmidnight\b/.exec(text);
  if (midnightMatch) return { hour: 0, minute: 0 };

  const timeMatch = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(text);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3].toLowerCase();
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return { hour, minute };
  }

  const bareTimeMatch = /\bat\s+(\d{1,2})(?::(\d{2}))?\b/.exec(text);
  if (bareTimeMatch) {
    const hour = parseInt(bareTimeMatch[1]);
    const minute = bareTimeMatch[2] ? parseInt(bareTimeMatch[2]) : 0;
    return { hour, minute };
  }

  return null;
}

function getNextWeekday(dayIndex: number, fromDate: Date, preferNextWeek = false): Date {
  const result = new Date(fromDate);
  result.setHours(0, 0, 0, 0);
  const current = result.getDay();
  let diff = dayIndex - current;
  if (diff <= 0 || preferNextWeek) diff += 7;
  result.setDate(result.getDate() + diff);
  return result;
}

function parseDate(text: string, now: Date): Date | null {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) return new Date(now);
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }

  const nextDayMatch = /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i.exec(lower);
  if (nextDayMatch) {
    const idx = getWeekdayIndex(nextDayMatch[1]);
    if (idx !== -1) return getNextWeekday(idx, now, true);
  }

  const thisDayMatch = /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i.exec(lower);
  if (thisDayMatch) {
    const idx = getWeekdayIndex(thisDayMatch[1]);
    if (idx !== -1) return getNextWeekday(idx, now, false);
  }

  const bareDayMatch = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.exec(lower);
  if (bareDayMatch) {
    const idx = getWeekdayIndex(bareDayMatch[1]);
    if (idx !== -1) return getNextWeekday(idx, now, false);
  }

  const monthNames = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthShort = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const monthDateMatch = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\b/i.exec(lower);
  if (monthDateMatch) {
    let mIdx = monthNames.indexOf(monthDateMatch[1].toLowerCase());
    if (mIdx === -1) mIdx = monthShort.indexOf(monthDateMatch[1].toLowerCase());
    if (mIdx !== -1) {
      const day = parseInt(monthDateMatch[2]);
      const d = new Date(now.getFullYear(), mIdx, day);
      if (d < now) d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }

  const numericDateMatch = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(lower);
  if (numericDateMatch) {
    const month = parseInt(numericDateMatch[1]) - 1;
    const day = parseInt(numericDateMatch[2]);
    const year = numericDateMatch[3] ? parseInt(numericDateMatch[3]) : now.getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    return new Date(fullYear, month, day);
  }

  return null;
}

function parseRecurrence(text: string): string | null {
  const lower = text.toLowerCase();

  if (/\b(daily|every\s+day|each\s+day|every\s+morning|every\s+night|every\s+evening)\b/.test(lower)) {
    return 'daily';
  }
  if (/\b(weekly|every\s+week)\b/.test(lower)) return 'weekly';

  const everyDayMatch = /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i.exec(lower);
  if (everyDayMatch) {
    const day = WEEKDAYS[getWeekdayIndex(everyDayMatch[1])] || everyDayMatch[1];
    return `every-${day}`;
  }

  return null;
}

function formatDatetime(date: Date, time: { hour: number; minute: number } | null): string {
  const d = new Date(date);
  if (time) {
    d.setHours(time.hour, time.minute, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d.toISOString();
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parseNaturalLanguage(input: string, now: Date = new Date()): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  const text = input.trim();
  if (!text) return events;

  const sentences = text.split(/[.;!?\n]+/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase().trim();
    if (!lower) continue;

    const plantMatch = /water\s+(?:the\s+)?(.+?)\s+every\s+/i.exec(sentence);
    if (plantMatch) {
      const plantName = plantMatch[1].trim();
      const recurrence = parseRecurrence(sentence);
      events.push({
        id: uid(),
        type: 'plant',
        title: `Water ${plantName}`,
        datetime: null,
        recurrence: recurrence || 'weekly',
        original: sentence.trim(),
        createdAt: now.getTime(),
      });
      continue;
    }

    const remindMatch = /\bremind\s+(?:me\s+)?to\s+(.+)/i.exec(sentence);
    if (remindMatch) {
      const action = remindMatch[1].trim();
      const recurrence = parseRecurrence(sentence);
      const date = parseDate(sentence, now);
      const time = parseTime(sentence);

      events.push({
        id: uid(),
        type: recurrence ? 'recurring' : 'reminder',
        title: action.charAt(0).toUpperCase() + action.slice(1).replace(/\s+(daily|every\s+\w+|at\s+\d+.*)/i, '').trim(),
        datetime: date ? formatDatetime(date, time) : (time ? formatDatetime(now, time) : null),
        recurrence,
        original: sentence.trim(),
        createdAt: now.getTime(),
      });
      continue;
    }

    const recurrence = parseRecurrence(sentence);
    const date = parseDate(sentence, now);
    const time = parseTime(sentence);

    if (date || time || recurrence) {
      const cleanTitle = sentence
        .replace(/\b(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '')
        .replace(/\b(tomorrow|today)\b/gi, '')
        .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi, '')
        .replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '')
        .replace(/\bat\s+\d{1,2}(?::\d{2})?\b/gi, '')
        .replace(/\b(daily|every\s+day|every\s+\w+|weekly)\b/gi, '')
        .replace(/\bnoon\b|\bmidnight\b/gi, '')
        .trim()
        .replace(/^[,\s]+|[,\s]+$/g, '');

      const title = cleanTitle || 'Reminder';

      events.push({
        id: uid(),
        type: recurrence ? 'recurring' : 'appointment',
        title: title.charAt(0).toUpperCase() + title.slice(1),
        datetime: date ? formatDatetime(date, time) : (time ? formatDatetime(now, time) : null),
        recurrence,
        original: sentence.trim(),
        createdAt: now.getTime(),
      });
    }
  }

  if (events.length === 0 && text.length > 0) {
    events.push({
      id: uid(),
      type: 'reminder',
      title: text.charAt(0).toUpperCase() + text.slice(1),
      datetime: null,
      recurrence: null,
      original: text,
      createdAt: now.getTime(),
    });
  }

  return events;
}

export function formatEventSummary(event: ParsedEvent): string {
  const dt = event.datetime ? new Date(event.datetime) : null;
  const dateStr = dt
    ? dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) +
      ' at ' +
      dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  const recStr = event.recurrence
    ? event.recurrence === 'daily'
      ? 'every day'
      : event.recurrence === 'weekly'
      ? 'every week'
      : event.recurrence.replace('every-', 'every ').replace(/^\w/, c => c.toUpperCase())
    : '';

  if (event.type === 'plant') {
    return `🌿 "${event.title}" scheduled ${recStr || 'weekly'}`;
  }
  if (event.type === 'recurring') {
    return `💊 "${event.title}" set for ${recStr}${dateStr ? ' starting ' + dateStr : ''}`;
  }
  if (event.type === 'appointment') {
    return `📅 "${event.title}" saved${dateStr ? ' for ' + dateStr : ''}`;
  }
  return `⏰ "${event.title}" noted${dateStr ? ' for ' + dateStr : ''}`;
}
