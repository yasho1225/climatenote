import { UserProfile } from '../types';
import { resolvePublicDisplayName } from './publicProfile';

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return 'there';
  return resolvePublicDisplayName(profile, 'there');
}

export function getInitials(profile: UserProfile | null): string {
  const name = getDisplayName(profile);
  return name.substring(0, 2).toUpperCase();
}

export function getAvatarColor(userId: string): string {
  const palette = [
    'bg-sage-400',
    'bg-sage-500',
    'bg-sage-600',
    'bg-emerald-500',
    'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export function getMasteryLevel(totalNotes: number): { level: number; title: string; xp: number; xpMax: number } {
  const level = Math.max(1, Math.floor(totalNotes / 5) + 1);
  const titles = [
    'Seed Starter',
    'Green Sprout',
    'Eco Explorer',
    'Climate Ally',
    'Consistent Contributor',
    'Habit Builder',
    'Community Regular',
  ];
  const title = titles[Math.min(level - 1, titles.length - 1)];
  const xpInLevel = (totalNotes % 5) * 200;
  return { level, title, xp: xpInLevel || (totalNotes > 0 ? 200 : 0), xpMax: 1000 };
}
