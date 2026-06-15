import React from 'react';
import { Zap, Flame, Search } from 'lucide-react';
import { UserProfile } from '../../types';
import { getAvatarColor, getDisplayName, getGreeting, getInitials } from '../../lib/userDisplay';

export type AppTab = 'home' | 'community' | 'notes' | 'impact' | 'profile';

interface AppHeaderProps {
  variant: 'home' | 'title';
  userProfile: UserProfile | null;
  onProfilePress: () => void;
  onNotificationsPress: () => void;
  onSearchPress?: () => void;
  showSearch?: boolean;
}

export default function AppHeader({
  variant,
  userProfile,
  onProfilePress,
  onNotificationsPress,
  onSearchPress,
  showSearch = true,
}: AppHeaderProps) {
  return (
    <header className="shrink-0 z-40 bg-sage-50/90 backdrop-blur-md px-4 pt-3 pb-3 safe-top border-b border-sage-200/50">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onProfilePress}
          className="flex items-center gap-3 min-w-0 text-left"
        >
          {userProfile ? (
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-card ${getAvatarColor(userProfile.id)}`}
            >
              {getInitials(userProfile)}
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full bg-sage-200 shrink-0" />
          )}

          {variant === 'home' && userProfile && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-forest truncate">
                {getGreeting()}, {getDisplayName(userProfile)}
              </p>
              <div className="flex items-center gap-1 text-xs text-sage-600 font-medium">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>{userProfile.streak} Day Streak</span>
              </div>
            </div>
          )}
        </button>

        {variant === 'title' && (
          <h1 className="text-[15px] font-bold text-forest absolute left-1/2 -translate-x-1/2 pointer-events-none tracking-tight">
            The Climate Note
          </h1>
        )}

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {showSearch && onSearchPress && (
            <button
              type="button"
              onClick={onSearchPress}
              className="touch-target w-10 h-10 rounded-full bg-sage-100/80 flex items-center justify-center text-sage-600 active:bg-sage-200 transition-colors shadow-card"
              aria-label="Search stories"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={onNotificationsPress}
            className="touch-target w-10 h-10 rounded-full bg-sage-100/80 flex items-center justify-center text-sage-600 active:bg-sage-200 transition-colors shadow-card"
            aria-label="Notifications"
          >
            <Zap className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
