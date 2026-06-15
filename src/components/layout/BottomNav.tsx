import React from 'react';
import { Home, Users, FileText, Leaf, User } from 'lucide-react';
import { AppTab } from './AppHeader';

interface BottomNavProps {
  current: AppTab;
  onChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'impact', label: 'Impact', icon: Leaf },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav({ current, onChange }: BottomNavProps) {
  return (
    <nav className="shrink-0 z-50 bg-sage-50/92 backdrop-blur-md border-t border-sage-200/60 safe-bottom">
      <div className="flex items-stretch justify-around px-1 pt-2 pb-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`touch-target flex flex-col items-center justify-center flex-1 min-h-[52px] py-1.5 gap-0.5 transition-colors rounded-xl active:opacity-70 ${
                active ? 'text-forest' : 'text-ink-muted'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-forest mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
