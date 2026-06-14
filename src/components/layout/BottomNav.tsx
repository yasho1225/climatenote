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
    <nav className="fixed mobile-frame-fixed bottom-0 left-0 right-0 z-50 app-chrome border-t safe-bottom">
      <div className="max-w-lg mx-auto flex items-stretch justify-around px-1 pt-2 pb-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 transition-colors rounded-xl ${
                active ? 'text-forest' : 'text-sage-400'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'stroke-[2.5px] text-sage-600' : ''}`} />
              <span className={`text-[10px] font-medium ${active ? 'font-semibold text-sage-600' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-sage-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
