import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Users, Heart, Calendar, X, Share2, Leaf, Footprints, UtensilsCrossed, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './ui/Toast';
import { UserNote, UserProfile } from '../types';
import NoteCardGenerator from './NoteCardGenerator';
import { colorSeedForProfile, publicAuthorInitial, publicAuthorName } from '../lib/publicProfile';
import { useRequestGuard } from '../lib/useRequestGuard';

interface NotebookViewProps {
  userProfile: UserProfile | null;
  onWriteNote?: () => void;
}

interface NoteWithReactions extends UserNote {
  user_profiles: { display_name: string | null; email: string | null; id: string };
  articles: { title: string; published_date: string };
  reaction_count: number;
  user_has_reacted: boolean;
}

interface PopupNote {
  note: NoteWithReactions;
  position: { x: number; y: number };
}

const TRENDING = [
  { icon: Footprints, label: 'Walk to Work' },
  { icon: UtensilsCrossed, label: 'Plant-based Meal' },
  { icon: Leaf, label: 'Local Produce' },
];

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
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [popupNote, setPopupNote] = useState<PopupNote | null>(null);
  const [shareNote, setShareNote] = useState<(UserNote & { article_title?: string }) | null>(null);
  const { nextGeneration, isCurrent } = useRequestGuard();

  const loadNotes = useCallback(async () => {
    const generation = nextGeneration();
    setLoading(true);
    try {
      let notesQuery = supabase
        .from('user_notes')
        .select(`
          *,
          user_profiles!inner(id, display_name, email),
          articles!inner(title, published_date)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'mine' && userProfile) {
        notesQuery = notesQuery.eq('user_id', userProfile.id);
      }

      const { data: notesData, error: notesError } = await notesQuery;
      if (notesError) throw notesError;

      if (!notesData) {
        if (isCurrent(generation)) setNotes([]);
        return;
      }

      const noteIds = notesData.map(note => note.id);

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

      // Combine data
      const notesWithReactions: NoteWithReactions[] = notesData.map(note => ({
        ...note,
        reaction_count: reactionCounts?.filter(r => r.note_id === note.id).length || 0,
        user_has_reacted: userReactions.some(r => r.note_id === note.id)
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
  }, [filter, userProfile, nextGeneration, isCurrent]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleEncourage = async (noteId: string, currentlyReacted: boolean) => {
    if (!userProfile) {
      showToast('Please sign in to encourage others!', 'info');
      return;
    }

    try {
      if (currentlyReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('note_reactions')
          .delete()
          .eq('note_id', noteId)
          .eq('user_id', userProfile.id);

        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('note_reactions')
          .insert({
            note_id: noteId,
            user_id: userProfile.id,
            reaction_type: 'encourage'
          });

        // Handle duplicate key constraint - reaction already exists
        if (error && error.code !== '23505') {
          throw error;
        }
      }

      // Update local state
      const updateNote = (note: NoteWithReactions) =>
        note.id === noteId
          ? {
              ...note,
              reaction_count: currentlyReacted
                ? note.reaction_count - 1
                : note.reaction_count + 1,
              user_has_reacted: !currentlyReacted,
            }
          : note;

      setNotes((prevNotes) => prevNotes.map(updateNote));
      setPopupNote((prev) =>
        prev && prev.note.id === noteId
          ? { ...prev, note: updateNote(prev.note) }
          : prev
      );

      if (!currentlyReacted) {
        showToast('Encouragement sent! 💚', 'success');
      }
    } catch (error: any) {
      showToast('Failed to update reaction', 'error');
      console.error('Error updating reaction:', error);
    }
  };

  const getCircleColor = (seed: string) => {
    const colors = [
      'bg-pink-300', 'bg-rose-300', 'bg-orange-300', 'bg-amber-300',
      'bg-yellow-300', 'bg-lime-300', 'bg-emerald-300', 'bg-teal-300',
      'bg-cyan-300', 'bg-sky-300', 'bg-blue-300', 'bg-violet-300'
    ];
    const hash = seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const handleCircleClick = (note: NoteWithReactions, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopupNote({
      note,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
  };

  const closePopup = () => {
    setPopupNote(null);
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="animate-pulse text-sage-600 text-sm">Loading community...</div>
      </div>
    );
  }

  const co2Estimate = (notes.length * 1.2).toFixed(0);

  return (
    <div className="max-w-lg mx-auto px-4 pb-24 relative pt-2">
      {/* Hero card */}
      <div className="card-surface p-6 mb-5">
        <h1 className="text-2xl font-bold text-forest mb-3">Community Notebook</h1>
        <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 px-3 py-1.5 rounded-full text-xs font-semibold">
          <Leaf className="w-3.5 h-3.5" />
          <span>{co2Estimate}kg CO₂ saved today</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-forest text-white' : 'card-surface text-sage-600'
          }`}
        >
          <Users className="w-4 h-4" />
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter('mine')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            filter === 'mine' ? 'bg-forest text-white' : 'card-surface text-sage-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Mine
        </button>
      </div>

      {/* Trending */}
      <div className="mb-5">
        <h2 className="text-base font-bold text-earth mb-3">Trending Actions</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TRENDING.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="shrink-0 w-28 card-surface p-4 flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
                <Icon className="w-5 h-5 text-sage-600" />
              </div>
              <span className="text-xs font-semibold text-forest text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div>
        <h2 className="text-base font-bold text-earth mb-3">Community Feed</h2>
        {notes.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-sage-600 text-sm">No notes yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={(e) => handleCircleClick(note, e)}
                className="w-full card-surface p-4 text-left hover:shadow-soft transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${getCircleColor(colorSeedForProfile(note.user_profiles, note.user_id))}`}>
                    {publicAuthorInitial(note.user_profiles)}
                  </div>
                  <div>
                    <p className="font-semibold text-forest text-sm">{publicAuthorName(note.user_profiles)}</p>
                    <p className="text-xs text-sage-400">{timeAgo(note.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-forest/75 leading-relaxed line-clamp-3">{note.content}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {onWriteNote && (
        <button
          type="button"
          onClick={onWriteNote}
          className="fixed bottom-20 right-4 w-14 h-14 bg-forest rounded-full shadow-soft flex items-center justify-center text-white z-30 hover:bg-forest-light transition-colors"
          aria-label="Write a note"
        >
          <Pencil className="w-6 h-6" />
        </button>
      )}

      {/* Note Card Generator Modal */}
      {shareNote && userProfile && (
        <NoteCardGenerator
          note={shareNote}
          userProfile={userProfile}
          onClose={() => setShareNote(null)}
        />
      )}

      {/* Popup Modal */}
      {popupNote && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closePopup}
          ></div>
          
          {/* Popup */}
          <div
            className="fixed z-50 bg-gradient-to-br from-pink-50 to-blue-50 rounded-2xl shadow-2xl p-4 sm:p-6 max-w-md w-72 sm:w-80 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 sm:translate-y-0 border-4 border-white"
            style={{
              left: window.innerWidth < 640 ? '50%' : `${popupNote.position.x}px`,
              top: window.innerWidth < 640 ? '50%' : `${popupNote.position.y - 10}px`,
            }}
          >
            {/* Close button */}
            <button
              onClick={closePopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* User info */}
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-12 h-12 rounded-full ${getCircleColor(colorSeedForProfile(popupNote.note.user_profiles, popupNote.note.user_id))}
                flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {publicAuthorInitial(popupNote.note.user_profiles)}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  {publicAuthorName(popupNote.note.user_profiles)}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(popupNote.note.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Article reference */}
            <div className="mb-3 bg-white/60 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-emerald-600 mb-1">
                📰 Action from:
              </h4>
              <p className="text-sm text-gray-700">{popupNote.note.articles.title}</p>
            </div>

            {/* Note content */}
            <div className="mb-4 bg-white/60 rounded-lg p-3">
              <p className="text-gray-800 leading-relaxed text-sm">
                {popupNote.note.content}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => handleEncourage(popupNote.note.id, popupNote.note.user_has_reacted)}
                className={`flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-semibold transition-all transform hover:scale-105 shadow-md ${
                  popupNote.note.user_has_reacted
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'
                    : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-400 hover:to-rose-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${popupNote.note.user_has_reacted ? 'fill-current' : ''}`} />
                <span>
                  {popupNote.note.user_has_reacted ? 'Encouraged!' : 'Encourage'}
                  {popupNote.note.reaction_count > 0 && ` (${popupNote.note.reaction_count})`}
                </span>
              </button>

              {/* Share button — only for the user's own notes */}
              {userProfile && popupNote.note.user_id === userProfile.id && (
                <button
                  onClick={() => {
                    setShareNote({
                      id: popupNote.note.id,
                      user_id: popupNote.note.user_id,
                      article_id: popupNote.note.article_id,
                      content: popupNote.note.content,
                      created_at: popupNote.note.created_at,
                      article_title: popupNote.note.articles.title,
                    });
                    closePopup();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-all shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}