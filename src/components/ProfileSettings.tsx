import React, { useState } from 'react';
import { X, Flame, BookOpen, Calendar, User, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { showToast } from './ui/Toast';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
  onRequestDeleteAccount: () => void;
}

export default function ProfileSettings({
  userProfile,
  onClose,
  onProfileUpdate,
  onRequestDeleteAccount,
}: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(userProfile.display_name || '');
  const [saving, setSaving] = useState(false);

  const currentName = userProfile.display_name || userProfile.email?.split('@')[0] || 'You';

  const avatarPalette = [
    { bg: 'bg-emerald-500', text: 'text-white' },
    { bg: 'bg-blue-500', text: 'text-white' },
    { bg: 'bg-purple-500', text: 'text-white' },
    { bg: 'bg-orange-500', text: 'text-white' },
    { bg: 'bg-pink-500', text: 'text-white' },
    { bg: 'bg-teal-500', text: 'text-white' },
  ];
  const avatarColor = (() => {
    let hash = 0;
    for (let i = 0; i < userProfile.id.length; i++) {
      hash = userProfile.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarPalette[Math.abs(hash) % avatarPalette.length];
  })();

  const initials = currentName.substring(0, 2).toUpperCase();

  const memberSince = new Date(userProfile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const handleSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      showToast('Display name cannot be empty', 'error');
      return;
    }
    if (trimmed.length > 30) {
      showToast('Display name must be 30 characters or less', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ display_name: trimmed })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (error) throw error;
      onProfileUpdate(data);
      showToast('Profile updated!', 'success');
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Profile &amp; Account</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor.bg} ${avatarColor.text}`}
            >
              {initials}
            </div>
            <p className="text-xs text-gray-400">{userProfile.email}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
              <p className="font-bold text-lg text-orange-700">{userProfile.streak}</p>
              <p className="text-xs text-orange-500">day streak</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <BookOpen className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="font-bold text-lg text-emerald-700">{userProfile.total_notes}</p>
              <p className="text-xs text-emerald-500">notes written</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="font-bold text-xs text-blue-700 leading-tight">{memberSince}</p>
              <p className="text-xs text-blue-500 mt-0.5">member since</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Display name
              <span className="text-gray-400 font-normal ml-1">(shown on leaderboard &amp; note cards)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={currentName}
                maxLength={30}
                className="w-full pl-9 pr-12 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {displayName.length}/30
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-3">
          <button
            onClick={handleSave}
            disabled={saving || displayName.trim() === (userProfile.display_name || '')}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {saving ? 'Saving…' : 'Save Profile'}
          </button>

          <div className="pt-3 border-t border-gray-100">
            <button
              onClick={onRequestDeleteAccount}
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete account…
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
