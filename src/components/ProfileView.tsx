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
  Shield,
  FileText,
  Trash2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { getAvatarColor, getDisplayName, getInitials, getMasteryLevel } from '../lib/userDisplay';
import { openLegalPage, openSupportEmail, LEGAL } from '../lib/legalLinks';

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
    { icon: User, label: 'Profile & account', subtitle: 'Name and email', onClick: onEditProfile },
    { icon: Target, label: 'My goals', onClick: onGoals },
    { icon: Bell, label: 'Notifications', onClick: onNotifications },
    { icon: Flame, label: 'Leaderboard', onClick: onLeaderboard },
    { icon: Trash2, label: 'Delete account', subtitle: 'Permanently remove your account', onClick: onDeleteAccount, danger: true },
  ];

  return (
    <div className="app-screen space-y-5">
      <div className="app-card p-6 text-center">
        <div
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-community ${getAvatarColor(userProfile.id)}`}
        >
          {getInitials(userProfile)}
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">{getDisplayName(userProfile)}</h2>
        <p className="text-sm text-ink-soft mt-1">Level {mastery.level}: {mastery.title}</p>
        <p className="text-xs text-ink-muted mt-1">Member since {memberSince}</p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="stat-tile stat-tile--streak">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-orange-700">{userProfile.streak}</p>
            <p className="text-xs text-orange-600/80">day streak</p>
          </div>
          <div className="stat-tile stat-tile--notes">
            <BookOpen className="w-5 h-5 text-sage-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-ink">{userProfile.total_notes}</p>
            <p className="text-xs text-ink-muted">notes written</p>
          </div>
        </div>
      </div>

      <div className="app-card overflow-hidden">
        {menuItems.map(({ icon: Icon, label, subtitle, onClick, danger }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-4 transition-colors border-b border-sage-100/80 last:border-0 ${
              danger ? 'hover:bg-red-50' : 'hover:bg-mist'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              danger ? 'bg-red-50' : 'bg-sage-100'
            }`}>
              <Icon className={`w-4 h-4 ${danger ? 'text-red-600' : 'text-sage-600'}`} strokeWidth={2} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className={`block font-semibold text-sm ${danger ? 'text-red-600' : 'text-ink'}`}>{label}</span>
              {subtitle ? (
                <span className={`block text-xs mt-0.5 ${danger ? 'text-red-500/80' : 'text-ink-muted'}`}>{subtitle}</span>
              ) : null}
            </div>
            <ChevronRight className={`w-4 h-4 shrink-0 ${danger ? 'text-red-300' : 'text-sage-300'}`} />
          </button>
        ))}
      </div>

      {(isWriter || isAdmin) && (
        <div className="app-card overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-earth-warm uppercase tracking-wider">
            Writer tools
          </p>
          {isWriter && (
            <button
              type="button"
              onClick={onAdminPanel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-mist transition-colors"
            >
              <Plus className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-semibold text-ink">Create article</span>
            </button>
          )}
          {isWriter && (
            <button
              type="button"
              onClick={onWriterPanel}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-mist transition-colors"
            >
              <FileEdit className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-semibold text-ink">My articles</span>
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={onArticleReview}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-mist transition-colors"
            >
              <CheckSquare className="w-4 h-4 text-sage-600" />
              <span className="text-sm font-semibold text-ink">Review articles</span>
            </button>
          )}
        </div>
      )}

      <div className="app-card overflow-hidden">
        <button
          type="button"
          onClick={() => void openLegalPage('privacy')}
          className="w-full flex items-center gap-3 px-4 py-4 active:bg-mist transition-colors border-b border-sage-100/80"
        >
          <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center">
            <Shield className="w-4 h-4 text-sage-600" strokeWidth={2} aria-hidden />
          </div>
          <span className="flex-1 text-left font-semibold text-ink text-sm">Privacy Policy</span>
          <ChevronRight className="w-4 h-4 text-sage-300 shrink-0" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => void openLegalPage('terms')}
          className="w-full flex items-center gap-3 px-4 py-4 active:bg-mist transition-colors border-b border-sage-100/80"
        >
          <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center">
            <FileText className="w-4 h-4 text-sage-600" strokeWidth={2} aria-hidden />
          </div>
          <span className="flex-1 text-left font-semibold text-ink text-sm">Terms of Service</span>
          <ChevronRight className="w-4 h-4 text-sage-300 shrink-0" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => openSupportEmail()}
          className="w-full flex items-center gap-3 px-4 py-4 active:bg-mist transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-sage-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-sage-600" strokeWidth={2} aria-hidden />
          </div>
          <div className="flex-1 text-left min-w-0">
            <span className="block font-semibold text-ink text-sm">Support</span>
            <span className="block text-xs text-ink-muted mt-0.5 truncate">{LEGAL.supportEmail}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-sage-300 shrink-0" aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-sage-200 text-ink-soft font-semibold text-sm hover:bg-mist transition-colors app-card"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>

      <div className="app-card p-4 border border-red-100/80">
        <p className="text-xs font-bold text-earth-warm uppercase tracking-wider mb-2">
          Danger zone
        </p>
        <p className="text-xs text-ink-muted mb-3 leading-relaxed">
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
