import {
  Leaf,
  Shirt,
  Waves,
  UtensilsCrossed,
  Zap,
  TreePine,
  Landmark,
  type LucideIcon,
} from 'lucide-react';

const IMAGE_IN_HTML = /<img[^>]+src=["']([^"']+)["']/i;
const IMAGE_URL = /https?:\/\/[^\s<>"']+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s<>"']*)?/i;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Fashion: Shirt,
  Ocean: Waves,
  Food: UtensilsCrossed,
  Energy: Zap,
  Wildlife: TreePine,
  Policy: Landmark,
};

const CATEGORY_ACCENT: Record<string, string> = {
  Fashion: 'bg-rose-50 text-rose-600',
  Ocean: 'bg-sky-50 text-sky-700',
  Food: 'bg-amber-50 text-amber-700',
  Energy: 'bg-yellow-50 text-yellow-700',
  Wildlife: 'bg-emerald-50 text-emerald-700',
  Policy: 'bg-slate-100 text-slate-600',
};

export function getArticleCoverImage(content: string): string | null {
  const htmlMatch = content.match(IMAGE_IN_HTML);
  if (htmlMatch?.[1]) {
    return htmlMatch[1];
  }

  const urlMatch = content.match(IMAGE_URL);
  return urlMatch?.[0] ?? null;
}

export function getCategoryIcon(category?: string): LucideIcon {
  if (!category) {
    return Leaf;
  }
  return CATEGORY_ICONS[category] ?? Leaf;
}

export function getCategoryAccent(category?: string): string {
  if (!category) {
    return 'bg-sage-100 text-sage-600';
  }
  return CATEGORY_ACCENT[category] ?? 'bg-sage-100 text-sage-600';
}
