import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export function timeUntil(isoString: string): string {
  const dt = new Date(isoString);
  const now = new Date();
  const diff = dt.getTime() - now.getTime();
  if (diff < 0) return 'overdue';
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'in a moment';
  if (minutes < 60) return `in ${minutes} min`;
  if (hours < 24) return `in ${hours} hr${hours !== 1 ? 's' : ''}`;
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

export function formatTime(isoString: string): string {
  const dt = new Date(isoString);
  return dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDate(isoString: string): string {
  const dt = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (dt.toDateString() === today.toDateString()) return 'Today';
  if (dt.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning ☀️";
  if (hour < 17) return "Good afternoon 🌤️";
  return "Good evening 🌙";
}

export function todayStr(): string {
  return new Date().toDateString();
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
