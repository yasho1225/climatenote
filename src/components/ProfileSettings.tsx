import React, { useState } from 'react';
import { X, Flame, BookOpen, Calendar, User, Check, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { showToast } from './ui/Toast';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  onClose: () => void;
  onProfileUpdate: (profile: UserProfile) => void;
  onAccountDeleted?: () => void;
}

export default function ProfileSettings({ userProfile, onClose, onProfileUpdate, onAccountDeleted }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(userProfile.display_name || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const currentName = userProfile.display_name || userProfile.email?.split('@')[0] || 'You';

  // Avatar color — consistent with LeaderboardView
  const avatarPalette = [
    { bg: 'bg-emerald-500', text: 'text-white' },
    { bg: 'bg-blue-500',    text: 'text-white' },
    { bg: 'bg-purple-500',  text: 'text-white' },
    { bg: 'bg-orange-500',  text: 'text-white' },
    { bg: 'bg-pink-500',    text: 'text-white' },
    { bg: 'bg-teal-500',    text: 'text-white' },
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
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setDeleting(true);
    try {
      // Call the Supabase edge function to permanently delete the account
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      showToast('Your account has been permanently deleted.', 'success');

      // Sign the user out and navigate to landing page
      await supabase.auth.signOut();
      if (onAccountDeleted) {
        onAccountDeleted();
      }
    } catch (err: any) {
      console.error('Account deletion error:', err);
      showToast(err.message || 'Failed to delete account. Please try again.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Delete confirmation dialog
  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-red-100 bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-red-900">Delete Account</h3>
            </div>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
              }}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-red-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-medium">
                This action is permanent and cannot be undone.
              </p>
              <p className="text-sm text-gray-600">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                <li>Your profile and display name</li>
                <li>All your climate notes</li>
                <li>Your streak and progress data</li>
                <li>Your goals and impact data</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="px-5 pb-5 space-y-2">
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmText !== 'DELETE'}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              {deleting ? 'Deleting Account...' : 'Permanently Delete Account'}
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteConfirmText('');
              }}
              className="w-full py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
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
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${avatarColor.bg} ${avatarColor.text}`}
            >
              {initials}
            </div>
            <p className="text-xs text-gray-400">{userProfile.email}</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-orange-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <p className="font-bold text-lg text-orange-700">{userProfile.streak}</p>
              <p className="text-xs text-orange-500">day streak</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <BookOpen className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="font-bold text-lg text-emerald-700">{userProfile.total_notes}</p>
              <p className="text-xs text-emerald-500">notes written</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <p className="font-bold text-xs text-blue-700 leading-tight">{memberSince}</p>
              <p className="text-xs text-blue-500 mt-0.5">member since</p>
            </div>
          </div>

          {/* Display Name Field */}
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
            <p className="text-xs text-gray-400 mt-1">
              This is the name others see — keep it friendly!
            </p>
          </div>
        </div>

        {/* Save Button */}
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

          {/* Delete Account */}
          <div className="pt-3 border-t border-gray-100">
            <p className="mb-2 text-xs text-gray-500 text-center">
              Need to remove your data? You can permanently delete your account here.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
