import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Heart,
  Calendar,
  X,
  Share2,
  Leaf,
  Footprints,
  UtensilsCrossed,
  Pencil,
  MapPin,
  Search,
  Flag,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './ui/Toast';
import { UserNote, UserProfile } from '../types';
import NoteCardGenerator from './NoteCardGenerator';
import { publicAuthorInitial, publicAuthorName } from '../lib/publicProfile';
import { openReportContent } from '../lib/legalLinks';
import { useRequestGuard } from '../lib/useRequestGuard';

interface NotebookViewProps {
  userProfile: UserProfile | null;
  onWriteNote?: () => void;
}

interface NoteWithReactions extends UserNote {
  user_profiles: { display_name: string | null; id: string };
  articles: { title: string; published_date: string };
  reaction_count: number;
  user_has_reacted: boolean;
}

interface PopupNote {
  note: NoteWithReactions;
}

const TRENDING = [
  {
    icon: Footprints,
    label: 'Walk to Work',
    circle: 'bg-sage-100',
    iconColor: 'text-forest',
    keywords: ['walk', 'commute', 'bike', 'transport'],
  },
  {
    icon: UtensilsCrossed,
    label: 'Plant-based Meal',
    circle: 'bg-terracotta-light',
    iconColor: 'text-terracotta',
    keywords: ['plant', 'meal', 'food', 'vegan', 'vegetarian'],
  },
  {
    icon: MapPin,
    label: 'Local Shop',
    circle: 'bg-mist',
    iconColor: 'text-sage-600',
    keywords: ['local', 'shop', 'buy', 'store'],
  },
] as const;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotebookView({ userProfile, onWriteNote }: NotebookViewProps) {
  const [notes, setNotes] = useState<NoteWithReactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupNote, setPopupNote] = useState<PopupNote | null>(null);
  const [shareNote, setShareNote] = useState<(UserNote & { article_title?: string }) | null>(null);
  const [feedSearch, setFeedSearch] = useState('');
  const [trendingFilter, setTrendingFilter] = useState<string | null>(null);
  const { nextGeneration, isCurrent } = useRequestGuard();

  const loadNotes = useCallback(async () => {
    const generation = nextGeneration();
    setLoading(true);
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('user_notes')
        .select(`
          *,
          articles!inner(title, published_date)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notesError) throw notesError;

      if (!notesData) {
        if (isCurrent(generation)) setNotes([]);
        return;
      }

      const authorIds = [...new Set(notesData.map((note) => note.user_id))];
      const { data: authorProfiles } = await supabase
        .from('community_profiles')
        .select('id, display_name')
        .in('id', authorIds);

      const profileById = new Map(
        (authorProfiles ?? []).map((profile) => [profile.id, profile]),
      );

      const noteIds = notesData.map((note) => note.id);
      let reactionCounts: { note_id: string }[] = [];
      let userReactions: { note_id: string }[] = [];

      if (noteIds.length > 0) {
        const { data: counts, error: countError } = await supabase
          .from('note_reactions')
          .select('note_id')
          .in('note_id', noteIds);

        if (countError) throw countError;
        reactionCounts = counts || [];

        if (userProfile) {
          const { data: userReactionData, error: userReactionError } = await supabase
            .from('note_reactions')
            .select('note_id')
            .in('note_id', noteIds)
            .eq('user_id', userProfile.id);

          if (userReactionError) throw userReactionError;
          userReactions = userReactionData || [];
        }
      }

      const notesWithReactions: NoteWithReactions[] = notesData.map((note) => ({
        ...note,
        user_profiles: profileById.get(note.user_id) ?? {
          id: note.user_id,
          display_name: null,
        },
        reaction_count: reactionCounts?.filter((r) => r.note_id === note.id).length || 0,
        user_has_reacted: userReactions.some((r) => r.note_id === note.id),
      }));

      if (isCurrent(generation)) {
        setNotes(notesWithReactions);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      if (isCurrent(generation)) {
        showToast('Failed to load notes', 'error');
      }
    } finally {
      if (isCurrent(generation)) {
        setLoading(false);
      }
    }
  }, [userProfile, nextGeneration, isCurrent]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const notesSharedToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return notes.filter((note) => new Date(note.created_at) >= startOfDay).length;
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const query = feedSearch.trim().toLowerCase();
    const trending = trendingFilter
      ? TRENDING.find((item) => item.label === trendingFilter)
      : null;

    return notes.filter((note) => {
      const author = publicAuthorName(note.user_profiles).toLowerCase();
      const content = note.content.toLowerCase();
      const articleTitle = note.articles.title.toLowerCase();

      if (query) {
        const matchesQuery = author.includes(query) || content.includes(query) || articleTitle.includes(query);
        if (!matchesQuery) return false;
      }

      if (trending) {
        const matchesTrending = trending.keywords.some(
          (keyword) => content.includes(keyword) || articleTitle.includes(keyword),
        );
        if (!matchesTrending) return false;
      }

      return true;
    });
  }, [notes, feedSearch, trendingFilter]);

  const handleEncourage = async (noteId: string, currentlyReacted: boolean) => {
    if (!userProfile) {
      showToast('Please sign in to encourage others!', 'info');
      return;
    }

    try {
      if (currentlyReacted) {
        const { error } = await supabase
          .from('note_reactions')
          .delete()
          .eq('note_id', noteId)
          .eq('user_id', userProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('note_reactions').insert({
          note_id: noteId,
          user_id: userProfile.id,
          reaction_type: 'encourage',
        });
        if (error && error.code !== '23505') throw error;
      }

      const updateNote = (note: NoteWithReactions) =>
        note.id === noteId
          ? {
              ...note,
              reaction_count: currentlyReacted ? note.reaction_count - 1 : note.reaction_count + 1,
              user_has_reacted: !currentlyReacted,
            }
          : note;

      setNotes((prev) => prev.map(updateNote));
      setPopupNote((prev) =>
        prev && prev.note.id === noteId ? { note: updateNote(prev.note) } : prev,
      );

      if (!currentlyReacted) {
        showToast('Encouragement sent!', 'success');
      }
    } catch {
      showToast('Failed to update reaction', 'error');
    }
  };

  if (loading) {
    return (
      <div className="app-screen py-16 text-center">
        <div className="animate-pulse text-ink-muted text-sm font-medium">Loading community...</div>
      </div>
    );
  }

  return (
    <div className="app-screen">
      {/* Hero */}
      <div className="community-card p-6 mb-5">
        <h1 className="community-hero-title mb-3">Community Notebook</h1>
        <div className="community-badge">
          <Leaf className="w-3.5 h-3.5 text-sage-600 shrink-0" strokeWidth={2.5} />
          <span>{notesSharedToday} action{notesSharedToday === 1 ? '' : 's'} shared today</span>
        </div>
      </div>

      {/* Trending Actions */}
      <section className="mb-5">
        <h2 className="community-section-title mb-3">Trending Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-0.5 px-0.5">
          {TRENDING.map(({ icon: Icon, label, circle, iconColor }) => {
            const active = trendingFilter === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setTrendingFilter(active ? null : label)}
                className={`community-card shrink-0 w-[7.5rem] p-4 flex flex-col items-center gap-3 transition-colors ${
                  active ? 'ring-2 ring-forest/30' : 'hover:bg-mist/40'
                }`}
                aria-pressed={active}
              >
                <div className={`w-[3.25rem] h-[3.25rem] rounded-full ${circle} flex items-center justify-center`}>
                  <Icon className={`w-[1.35rem] h-[1.35rem] ${iconColor}`} strokeWidth={2} />
                </div>
                <span className="text-xs font-bold text-ink text-center leading-snug">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Community Feed */}
      <section className="relative">
        <h2 className="community-section-title mb-3">Community Feed</h2>

        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none" />
          <input
            type="search"
            value={feedSearch}
            onChange={(e) => setFeedSearch(e.target.value)}
            placeholder="Search community posts..."
            className="w-full pl-10 pr-10 py-2.5 text-sm text-ink placeholder:text-ink-muted/60 input-field !pl-10 !pr-10"
            aria-label="Search community feed"
          />
          {feedSearch && (
            <button
              type="button"
              onClick={() => setFeedSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-forest"
              aria-label="Clear community search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {(feedSearch || trendingFilter) && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-ink-muted">
              {visibleNotes.length} post{visibleNotes.length !== 1 ? 's' : ''}
              {trendingFilter ? ` · ${trendingFilter}` : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                setFeedSearch('');
                setTrendingFilter(null);
              }}
              className="text-xs font-semibold text-forest"
            >
              Clear
            </button>
          </div>
        )}

        {notes.length === 0 ? (
          <div className="community-card p-8 text-center">
            <p className="text-ink font-semibold text-sm">No posts yet</p>
            <p className="text-ink-muted text-sm mt-1">Be the first to share your climate action.</p>
            {onWriteNote && (
              <button
                type="button"
                onClick={onWriteNote}
                className="mt-4 text-sm font-semibold text-forest hover:text-canopy"
              >
                Write today&apos;s note
              </button>
            )}
          </div>
        ) : visibleNotes.length === 0 ? (
          <div className="community-card p-8 text-center">
            <p className="text-ink font-semibold text-sm">No matching posts</p>
            <p className="text-ink-muted text-sm mt-1">Try a different search or trending filter.</p>
            <button
              type="button"
              onClick={() => {
                setFeedSearch('');
                setTrendingFilter(null);
              }}
              className="mt-4 text-sm font-semibold text-forest"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured post — matches wireframe single-card layout */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPopupNote({ note: visibleNotes[0] })}
                className="community-card w-full p-5 text-left pb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-sage-100 flex items-center justify-center text-canopy font-bold text-sm shrink-0">
                    {publicAuthorInitial(visibleNotes[0].user_profiles)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink text-[15px] leading-tight">
                      {publicAuthorName(visibleNotes[0].user_profiles)}
                    </p>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                      {timeAgo(visibleNotes[0].created_at)}
                    </p>
                  </div>
                </div>
                <p className="text-[15px] text-ink-soft leading-[1.55]">{visibleNotes[0].content}</p>
              </button>

              {onWriteNote && (
                <button
                  type="button"
                  onClick={onWriteNote}
                  className="community-fab absolute -bottom-3 right-3 z-10"
                  aria-label="Write a note"
                >
                  <Pencil className="w-6 h-6" strokeWidth={2} />
                </button>
              )}
            </div>

            {visibleNotes.slice(1).map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setPopupNote({ note })}
                className="community-card w-full p-5 text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center text-canopy font-bold text-sm shrink-0">
                    {publicAuthorInitial(note.user_profiles)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-ink text-sm">{publicAuthorName(note.user_profiles)}</p>
                    <p className="text-xs text-ink-muted">{timeAgo(note.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed line-clamp-4">{note.content}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {shareNote && userProfile && (
        <NoteCardGenerator
          note={shareNote}
          userProfile={userProfile}
          onClose={() => setShareNote(null)}
        />
      )}

      {popupNote && (
        <>
          <div
            className="fixed inset-0 bg-forest/35 z-40"
            onClick={() => setPopupNote(null)}
            aria-hidden
          />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm community-card p-5">
            <button
              type="button"
              onClick={() => setPopupNote(null)}
              className="absolute top-3 right-3 text-ink-muted hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pr-6">
              <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center text-canopy font-bold">
                {publicAuthorInitial(popupNote.note.user_profiles)}
              </div>
              <div>
                <p className="font-bold text-ink">{publicAuthorName(popupNote.note.user_profiles)}</p>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5">
                  <Calendar className="w-3 h-3" />
                  <span>{timeAgo(popupNote.note.created_at)}</span>
                </div>
              </div>
            </div>

            <div className="mb-3 bg-mist rounded-2xl p-3">
              <p className="text-[10px] font-bold text-sage-600 uppercase tracking-wide mb-1">
                Action from
              </p>
              <p className="text-sm text-ink font-medium">{popupNote.note.articles.title}</p>
            </div>

            <p className="text-[15px] text-ink-soft leading-relaxed mb-4">{popupNote.note.content}</p>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleEncourage(popupNote.note.id, popupNote.note.user_has_reacted)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  popupNote.note.user_has_reacted
                    ? 'bg-sage-500 text-white'
                    : 'bg-sage-100 text-forest hover:bg-sage-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${popupNote.note.user_has_reacted ? 'fill-current' : ''}`} />
                {popupNote.note.user_has_reacted ? 'Encouraged' : 'Encourage'}
                {popupNote.note.reaction_count > 0 && ` (${popupNote.note.reaction_count})`}
              </button>

              {userProfile && popupNote.note.user_id === userProfile.id && (
                <button
                  type="button"
                  onClick={() => {
                    setShareNote({
                      id: popupNote.note.id,
                      user_id: popupNote.note.user_id,
                      article_id: popupNote.note.article_id,
                      content: popupNote.note.content,
                      created_at: popupNote.note.created_at,
                      article_title: popupNote.note.articles.title,
                    });
                    setPopupNote(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border border-sage-200 text-forest hover:bg-sage-50"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}

              <button
                type="button"
                onClick={() => openReportContent(popupNote.note.id, popupNote.note.content)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold border border-sage-200 text-ink-muted hover:text-forest hover:bg-sage-50"
                aria-label="Report this note"
              >
                <Flag className="w-4 h-4" aria-hidden />
                Report
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
