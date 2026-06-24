import { NoteStyle, NOTE_FONTS } from './companionTypes';

// Background swatches for a saved note card.
export const NOTE_BG: Record<string, { label: string; class: string; dot: string }> = {
  default: { label: 'White', class: 'bg-white', dot: '#FFFFFF' },
  sand: { label: 'Sand', class: 'bg-[#FDFBF7]', dot: '#FDFBF7' },
  sage: { label: 'Sage', class: 'bg-[#D1E7DD]', dot: '#D1E7DD' },
  blue: { label: 'Blue', class: 'bg-[#E2EAFC]', dot: '#E2EAFC' },
  amber: { label: 'Amber', class: 'bg-[hsl(45_90%_93%)]', dot: '#FBEFC9' },
  rose: { label: 'Rose', class: 'bg-[hsl(350_80%_96%)]', dot: '#FBE4EA' },
};

// Text color choices.
export const NOTE_TEXT: Record<string, { label: string; class: string; dot: string }> = {
  default: { label: 'Default', class: 'text-foreground', dot: '#3A3A3A' },
  green: { label: 'Green', class: 'text-[hsl(150_40%_35%)]', dot: '#3E8160' },
  blue: { label: 'Blue', class: 'text-[hsl(220_50%_45%)]', dot: '#4B6FB8' },
  red: { label: 'Red', class: 'text-[hsl(0_60%_50%)]', dot: '#CC4343' },
  amber: { label: 'Amber', class: 'text-[hsl(35_80%_40%)]', dot: '#B8791A' },
  purple: { label: 'Purple', class: 'text-[hsl(270_40%_50%)]', dot: '#8158B8' },
};

export const NOTE_SIZE: Record<NonNullable<NoteStyle['fontSize']>, string> = {
  sm: 'text-xs',
  base: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

// Combine a NoteStyle into the class string applied to the note body.
export function styleClasses(style: NoteStyle): string {
  const parts: string[] = [];
  parts.push(NOTE_FONTS[style.font ?? 'sans']);
  parts.push(NOTE_SIZE[style.fontSize ?? 'base']);
  if (style.bold) parts.push('font-bold');
  else if (style.light) parts.push('font-light');
  if (style.italic) parts.push('italic');
  parts.push(NOTE_TEXT[style.fontColor ?? 'default']?.class ?? 'text-foreground');
  return parts.join(' ');
}
