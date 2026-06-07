import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Star, Flame, X, Check, Medal } from 'lucide-react';
import { UserProfile } from '../types';
import { publicAuthorName } from '../lib/publicProfile';
import { getAppToday, getAppDateRange } from '../lib/appTimezone';
import { showToast } from './ui/Toast';
import { useRequestGuard } from '../lib/useRequestGuard';

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  streak: number;
  note_count: number;
  avatar_url: string | null;
}

interface FeaturedNote {
  id: string;
  note_id: string;
  admin_message: string | null;
  featured_date: string;
  content: string;
  author_name: string;
  author_streak: number;
}

interface TodayNote {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string;
}

type Period = 'daily' | 'weekly' | 'monthly';

interface LeaderboardViewProps {
  userProfile: UserProfile | null;
}

export default function LeaderboardView({ userProfile }: LeaderboardViewProps) {
  const [period, setPeriod] = useState<Period>('daily');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [featuredNotes, setFeaturedNotes] = useState<FeaturedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [todayNotes, setTodayNotes] = useState<TodayNote[]>([]);
  const [selectedToFeature, setSelectedToFeature] = useState<Set<string>>(new Set());
  const [featureMessages, setFeatureMessages] = useState<Record<string, string>>({});
  const [savingFeatures, setSavingFeatures] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const { nextGeneration, isCurrent } = useRequestGuard();

  const loadRankings = useCallback(async (p: Period) => {
    const generation = nextGeneration();
    setLoading(true);
    try {
      const { start, end } = getAppDateRange(p);
      const { data: notes, error } = await supabase
        .from('user_notes')
        .select('user_id, user_profiles!inner(id, display_name, streak, avatar_url)')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;

      // Group by user_id in memory
      const grouped: Record<string, LeaderboardEntry> = {};
      for (const note of notes || []) {
        const profile = (note as any).user_profiles;
        if (!grouped[note.user_id]) {
          grouped[note.user_id] = {
            user_id: note.user_id,
            display_name: profile?.display_name || null,
            streak: profile?.streak || 0,
            avatar_url: profile?.avatar_url || null,
            note_count: 0,
          };
        }
        grouped[note.user_id].note_count++;
      }

      const sorted = Object.values(grouped).sort((a, b) => b.note_count - a.note_count);
      if (isCurrent(generation)) {
        setRankings(sorted);
      }
    } catch (err) {
      console.error('Error loading rankings:', err);
      if (isCurrent(generation)) {
        showToast('Failed to load leaderboard', 'error');
      }
    } finally {
      if (isCurrent(generation)) {
        setLoading(false);
      }
    }
  }, [nextGeneration, isCurrent]);

  const loadFeaturedNotes = useCallback(async () => {
    try {
      const todayStr = getAppToday();

      const { data: featured, error } = await supabase
        .from('featured_notes')
        .select('id, note_id, admin_message, featured_date')
        .eq('featured_date', todayStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!featured || featured.length === 0) {
        setFeaturedNotes([]);
        return;
      }

      const noteIds = featured.map((f: any) => f.note_id);
      const { data: notes, error: notesError } = await supabase
        .from('user_notes')
        .select('id, content, user_profiles!inner(display_name, streak)')
        .in('id', noteIds);

      if (notesError) throw notesError;

      const noteMap: Record<string, any> = {};
      for (const n of notes || []) {
        noteMap[n.id] = n;
      }

      const result: FeaturedNote[] = featured.map((f: any) => {
        const note = noteMap[f.note_id];
        const profile = note?.user_profiles;
        const authorName = publicAuthorName(profile);
        return {
          id: f.id,
          note_id: f.note_id,
          admin_message: f.admin_message,
          featured_date: f.featured_date,
          content: note?.content || '',
          author_name: authorName,
          author_streak: profile?.streak || 0,
        };
      });

      setFeaturedNotes(result);
    } catch (err) {
      console.error('Error loading featured notes:', err);
    }
  }, []);

  const loadTodayNotesForModal = useCallback(async () => {
    const { start, end } = getAppDateRange('daily');
    const { data, error } = await supabase
      .from('user_notes')
      .select('id, content, created_at, user_id, user_profiles!inner(display_name)')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    const notes: TodayNote[] = (data || []).map((n: any) => ({
      id: n.id,
      content: n.content,
      created_at: n.created_at,
      user_id: n.user_id,
      author_name: publicAuthorName(n.user_profiles),
    }));
    setTodayNotes(notes);

    // Pre-select already-featured notes
    const alreadyFeatured = new Set(featuredNotes.map((f) => f.note_id));
    setSelectedToFeature(alreadyFeatured);
    const msgs: Record<string, string> = {};
    for (const f of featuredNotes) {
      if (f.admin_message) msgs[f.note_id] = f.admin_message;
    }
    setFeatureMessages(msgs);
  }, [featuredNotes]);

  useEffect(() => {
    loadRankings(period);
    if (period === 'daily') loadFeaturedNotes();
  }, [period]);

  const openFeatureModal = async () => {
    setShowFeatureModal(true);
    await loadTodayNotesForModal();
  };

  const toggleFeatureNote = (noteId: string) => {
    const next = new Set(selectedToFeature);
    if (next.has(noteId)) {
      next.delete(noteId);
    } else if (next.size < 5) {
      next.add(noteId);
    }
    setSelectedToFeature(next);
  };

  const saveFeatureChoices = async () => {
    setSavingFeatures(true);
    try {
      const todayStr = getAppToday();

      const { error: deleteError } = await supabase
        .from('featured_notes')
        .delete()
        .eq('featured_date', todayStr);
      if (deleteError) throw deleteError;

      if (selectedToFeature.size > 0) {
        const toInsert = Array.from(selectedToFeature).map((noteId) => {
          const note = todayNotes.find((n) => n.id === noteId);
          return {
            note_id: noteId,
            user_id: note?.user_id,
            featured_date: todayStr,
            admin_message: featureMessages[noteId] || null,
          };
        });

        const { error } = await supabase.from('featured_notes').insert(toInsert);
        if (error) throw error;
      }

      setShowFeatureModal(false);
      await loadFeaturedNotes();
      showToast('Featured notes saved!', 'success');
    } catch (err) {
      console.error('Error saving featured notes:', err);
      showToast('Failed to save featured notes', 'error');
    } finally {
      setSavingFeatures(false);
    }
  };

  // Display helpers
  const getDisplayName = (entry: LeaderboardEntry): string =>
    publicAuthorName(entry);

  const getInitials = (entry: LeaderboardEntry): string =>
    getDisplayName(entry).substring(0, 2).toUpperCase();

  const avatarPalette = [
    'bg-emerald-100 text-emerald-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-orange-100 text-orange-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
    'bg-red-100 text-red-700',
    'bg-indigo-100 text-indigo-700',
  ];

  const getAvatarColor = (userId: string): string => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarPalette[Math.abs(hash) % avatarPalette.length];
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-2xl leading-none">🥇</span>;
    if (rank === 2) return <span className="text-2xl leading-none">🥈</span>;
    if (rank === 3) return <span className="text-2xl leading-none">🥉</span>;
    return (
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 font-semibold text-sm">
        {rank}
      </span>
    );
  };

  const periodLabel: Record<Period, string> = {
    daily: "Today's",
    weekly: "This Week's",
    monthly: "This Month's",
  };

  const emptyLabel: Record<Period, string> = {
    daily: 'today',
    weekly: 'this week',
    monthly: 'this month',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-7 h-7 text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        </div>
        <p className="text-gray-500 text-sm">Celebrating climate action — every note counts</p>
      </div>

      {/* Period Tab Switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 gap-1">
        {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              period === p
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Featured Notes — Daily Tab Only */}
      {period === 'daily' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <h2 className="font-semibold text-gray-800 text-sm">Featured Notes Today</h2>
            </div>
            {isAdmin && (
              <button
                onClick={openFeatureModal}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
              >
                + Feature Notes
              </button>
            )}
          </div>

          {featuredNotes.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-center">
              <Star className="w-8 h-8 text-amber-300 mx-auto mb-2" />
              <p className="text-sm text-amber-700 font-medium">
                {isAdmin
                  ? 'No notes featured yet today.'
                  : "Today's featured notes will appear here!"}
              </p>
              {isAdmin && (
                <p className="text-xs text-amber-600 mt-1">
                  Click "+ Feature Notes" to highlight inspiring notes from today.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {featuredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      {note.admin_message && (
                        <p className="text-xs text-amber-700 font-medium mb-1 italic">
                          "{note.admin_message}"
                        </p>
                      )}
                      <p className="text-gray-800 text-sm leading-relaxed">"{note.content}"</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 font-medium">{note.author_name}</span>
                        {note.author_streak > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-orange-500">
                            <Flame className="w-3 h-3" />
                            {note.author_streak}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rankings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-sm">{periodLabel[period]} Rankings</h2>
          {!loading && rankings.length > 0 && (
            <span className="text-xs text-gray-400">{rankings.length} writer{rankings.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-gray-400 text-sm">Loading rankings...</div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-14">
            <Medal className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No notes written {emptyLabel[period]} yet</p>
            <p className="text-gray-400 text-xs mt-1">Be the first to write your climate note!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((entry, idx) => {
              const rank = idx + 1;
              const isMe = entry.user_id === userProfile?.id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                    isMe
                      ? 'bg-emerald-50 border-emerald-200'
                      : rank <= 3
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-white border-gray-100'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    {getRankBadge(rank)}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarColor(entry.user_id)}`}
                  >
                    {getInitials(entry)}
                  </div>

                  {/* Name + Streak */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`font-semibold text-sm truncate ${
                          isMe ? 'text-emerald-700' : 'text-gray-800'
                        }`}
                      >
                        {getDisplayName(entry)}
                      </span>
                      {isMe && (
                        <span className="text-xs text-emerald-600 font-medium bg-emerald-100 px-1.5 py-0.5 rounded-full">
                          you
                        </span>
                      )}
                    </div>
                    {entry.streak > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Flame className="w-3 h-3 text-orange-400" />
                        <span className="text-xs text-orange-500">{entry.streak} day streak</span>
                      </div>
                    )}
                  </div>

                  {/* Note Count */}
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-bold text-base ${
                        rank === 1
                          ? 'text-amber-600'
                          : rank <= 3
                          ? 'text-amber-500'
                          : 'text-gray-600'
                      }`}
                    >
                      {entry.note_count}
                    </span>
                    <p className="text-xs text-gray-400 leading-none mt-0.5">
                      {entry.note_count === 1 ? 'note' : 'notes'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin: Feature Notes Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Feature Today's Notes</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select up to 5 notes to highlight ({selectedToFeature.size}/5 selected)
                </p>
              </div>
              <button
                onClick={() => setShowFeatureModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {todayNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No notes written today yet.
                </div>
              ) : (
                todayNotes.map((note) => {
                  const isSelected = selectedToFeature.has(note.id);
                  const isDisabled = !isSelected && selectedToFeature.size >= 5;
                  return (
                    <div
                      key={note.id}
                      onClick={() => !isDisabled && toggleFeatureNote(note.id)}
                      className={`border rounded-xl p-3 transition-colors ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>

                        {/* Note Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-medium mb-1">{note.author_name}</p>
                          <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
                            {note.content}
                          </p>

                          {/* Optional Message Input (shown when selected) */}
                          {isSelected && (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                placeholder="Optional: add a short highlight message (shown to readers)"
                                value={featureMessages[note.id] || ''}
                                onChange={(e) =>
                                  setFeatureMessages((prev) => ({
                                    ...prev,
                                    [note.id]: e.target.value,
                                  }))
                                }
                                className="w-full text-xs border border-emerald-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-300 bg-white placeholder-gray-400"
                                maxLength={100}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Save Button */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={saveFeatureChoices}
                disabled={savingFeatures}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {savingFeatures
                  ? 'Saving...'
                  : `Save (${selectedToFeature.size} note${selectedToFeature.size !== 1 ? 's' : ''} featured)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
