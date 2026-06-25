import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Heart, Calendar, X, Share2, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './ui/Toast';
import { UserNote, UserProfile } from '../types';
import NoteCardGenerator from './NoteCardGenerator';

interface NotebookViewProps {
  userProfile: UserProfile | null;
}

interface NoteWithReactions extends UserNote {
  user_profiles: { email: string };
  articles: { title: string; published_date: string };
  reaction_count: number;
  user_has_reacted: boolean;
}

interface PopupNote {
  note: NoteWithReactions;
  position: { x: number; y: number };
}

export default function NotebookView({ userProfile }: NotebookViewProps) {
  const [notes, setNotes] = useState<NoteWithReactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [popupNote, setPopupNote] = useState<PopupNote | null>(null);
  const [shareNote, setShareNote] = useState<(UserNote & { article_title?: string }) | null>(null);

  const handleReport = async (noteId: string) => {
    try {
      await supabase.from('content_reports').insert({
        note_id: noteId,
        reporter_id: userProfile?.id ?? null,
        reported_at: new Date().toISOString(),
      });
    } catch {
      // report stored best-effort; don't surface errors to user
    }
    showToast('Thank you. We will review this content within 24 hours.', 'success');
    setPopupNote(null);
  };

  useEffect(() => {
    loadNotes();
  }, [filter, userProfile]);

  const loadNotes = async () => {
    try {
      // First get the notes with basic info
      let notesQuery = supabase
        .from('user_notes')
        .select(`
          *,
          user_profiles!inner(email),
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
        setNotes([]);
        return;
      }

      // Get reaction counts and user reactions for each note
      const noteIds = notesData.map(note => note.id);
      
      // Get reaction counts
      const { data: reactionCounts, error: countError } = await supabase
        .from('note_reactions')
        .select('note_id')
        .in('note_id', noteIds);

      if (countError) throw countError;

      // Get user's reactions if logged in
      let userReactions: any[] = [];
      if (userProfile) {
        const { data: userReactionData, error: userReactionError } = await supabase
          .from('note_reactions')
          .select('note_id')
          .in('note_id', noteIds)
          .eq('user_id', userProfile.id);

        if (userReactionError) throw userReactionError;
        userReactions = userReactionData || [];
      }

      // Combine data
      const notesWithReactions: NoteWithReactions[] = notesData.map(note => ({
        ...note,
        reaction_count: reactionCounts?.filter(r => r.note_id === note.id).length || 0,
        user_has_reacted: userReactions.some(r => r.note_id === note.id)
      }));

      setNotes(notesWithReactions);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

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
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId 
            ? {
                ...note,
                reaction_count: currentlyReacted 
                  ? note.reaction_count - 1 
                  : note.reaction_count + 1,
                user_has_reacted: !currentlyReacted
              }
            : note
        )
      );

      if (!currentlyReacted) {
        showToast('Encouragement sent! 💚', 'success');
      }
    } catch (error: any) {
      showToast('Failed to update reaction', 'error');
      console.error('Error updating reaction:', error);
    }
  };

  const getCircleColor = (email: string) => {
    const colors = [
      'bg-pink-300', 'bg-rose-300', 'bg-orange-300', 'bg-amber-300',
      'bg-yellow-300', 'bg-lime-300', 'bg-emerald-300', 'bg-teal-300',
      'bg-cyan-300', 'bg-sky-300', 'bg-blue-300', 'bg-violet-300'
    ];
    const hash = email.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-center">
        <div className="animate-pulse text-emerald-600">Loading community notebook...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Community Notebook</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          See how others are turning climate awareness into daily action
        </p>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              filter === 'all'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Notes</span>
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              filter === 'mine'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>My Notes</span>
          </button>
        </div>
      </div>

      {/* Cute Notebook */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'mine' ? 'No notes yet' : 'No community notes yet'}
          </h3>
          <p className="text-gray-600">
            {filter === 'mine'
              ? 'Read today\'s article and write your first action note!'
              : 'Be the first to share your environmental action!'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Notebook Background */}
          <div
            className="bg-gradient-to-br from-pink-50 via-white to-blue-50 border-4 border-white rounded-3xl p-12 min-h-96 relative overflow-hidden shadow-xl"
          >
            {/* Decorative corner stickers */}
            <div className="absolute top-2 left-2 w-8 h-8 bg-yellow-200 rounded-full opacity-40"></div>
            <div className="absolute top-2 right-2 w-6 h-6 bg-pink-200 rounded-full opacity-40"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 bg-blue-200 rounded-full opacity-40"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-200 rounded-full opacity-40"></div>

            {/* Title with cute styling */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-1">
                🌸 Climate Actions 🌸
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">Click on any circle to see what others are doing!</p>
            </div>

            {/* User circles in grid layout */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 justify-items-center items-center py-6 sm:py-8 px-2 sm:px-4">
              {notes.map((note) => {
                return (
                  <button
                    key={note.id}
                    onClick={(e) => handleCircleClick(note, e)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${getCircleColor(note.user_profiles.email)}
                      hover:scale-125 transition-all duration-300 shadow-lg hover:shadow-2xl
                      border-3 border-white flex items-center justify-center text-white font-bold text-sm sm:text-base
                      hover:rotate-12 transform`}
                  >
                    {note.user_profiles.email.charAt(0).toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Cute footer message */}
            <div className="text-center mt-6 text-sm text-gray-500">
              ✨ {notes.length} {notes.length === 1 ? 'person is' : 'people are'} making a difference! ✨
            </div>
          </div>
        </div>
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
              <div className={`w-12 h-12 rounded-full ${getCircleColor(popupNote.note.user_profiles.email)}
                flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {popupNote.note.user_profiles.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">
                  Climate Champion
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

              {/* Report button — only for other users' notes */}
              {userProfile && popupNote.note.user_id !== userProfile.id && (
                <button
                  onClick={() => handleReport(popupNote.note.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-all shadow-md"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}