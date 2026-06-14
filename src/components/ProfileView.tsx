import React from 'react';
import {
  Flame,
  BookOpen,
  Target,
  Bell,
  LogOut,
  Plus,
  FileEdit,
  CheckSquare,
  ChevronRight,
  User,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getAvatarColor, getDisplayName, getInitials, getMasteryLevel } from '../lib/userDisplay';

interface ProfileViewProps {
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isWriter: boolean;
  onEditProfile: () => void;
  onNotifications: () => void;
  onGoals: () => void;
  onLeaderboard: () => void;
  onAdminPanel: () => void;
  onWriterPanel: () => void;
  onArticleReview: () => void;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export default function ProfileView({
  userProfile,
  isAdmin,
  isWriter,
  onEditProfile,
  onNotifications,
  onGoals,
  onLeaderboard,
  onAdminPanel,
  onWriterPanel,
  onArticleReview,
  onSignOut,
  onDeleteAccount,
}: ProfileViewProps) {
  if (!userProfile) return null;

  const mastery = getMasteryLevel(userProfile.total_notes);
  const memberSince = new Date(userProfile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const menuItems = [
    { icon: User, label: 'Profile & account', subtitle: 'Name, email, delete account', onClick: onEditProfile },
    { icon: Target, label: 'My goals', onClick: onGoals },
    { icon: Bell, label: 'Notifications', onClick: onNotifications },
    { icon: Flame, label: 'Leaderboard', onClick: onLeaderboard },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pb-6 space-y-5 pt-2">
      <div className="card-surface p-6 text-center">
        <div
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-card ${getAvatarColor(userProfile.id)}`}
        >
          {getInitials(userProfile)}
        </div>
        <h2 className="mt-4 text-xl font-bold text-forest">{getDisplayName(userProfile)}</h2>
        <p className="text-sm text-sage-600 mt-1">Level {mastery.level}: {mastery.title}</p>
        <p className="text-xs text-sage-400 mt-1">Member since {memberSince}</p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-orange-50 rounded-2xl p-3">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-orange-700">{userProfile.streak}</p>
            <p className="text-xs text-orange-500">day streak</p>
          </div>
          <div className="bg-sage-50 rounded-2xl p-3">
            <BookOpen className="w-5 h-5 text-sage-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-forest">{userProfile.total_notes}</p>
            <p className="text-xs text-sage-600">notes written</p>
          </div>
        </div>
      </div>

      <div className="card-surface overflow-hidden">
        {menuItems.map(({ icon: Icon, label, subtitle, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-sage-50 transition-colors border-b border-sage-50 last:border-0"
          >
            <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center">
              <Icon className="w-4 h-4 text-sage-600" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="block font-medium text-forest text-sm">{label}</span>
              {subtitle ? (
                <span className="block text-xs text-sage-500 mt-0.5">{subtitle}</span>
              ) : null}
            </div>
            <ChevronRight className="w-4 h-4 text-sage-300 shrink-0" />
          </button>
        ))}
      </div>

      {(isWriter || isAdmin) && (
        <div className="card-surface overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-sage-600 uppercase tracking-wider">
            Writer tools
          </p>
          {isWriter && (
            <button
              type="button"
              onClick={onAdminPanel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sage-50"
            >
              <Plus className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-medium text-forest">Create article</span>
            </button>
          )}
          {isWriter && (
            <button
              type="button"
              onClick={onWriterPanel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sage-50"
            >
              <FileEdit className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-medium text-forest">My articles</span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={onArticleReview}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sage-50"
            >
              <CheckSquare className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-medium text-forest">Review articles</span>
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-3xl border border-sage-200 text-sage-700 font-semibold text-sm hover:bg-sage-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>

      <div className="card-surface p-4 border border-red-100">
        <p className="text-xs font-bold text-sage-600 uppercase tracking-wider mb-2">
          Danger zone
        </p>
        <p className="text-xs text-sage-500 mb-3 leading-relaxed">
          Permanently delete your account and all data. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={onDeleteAccount}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete account
        </button>
      </div>
    </div>
  );
}
