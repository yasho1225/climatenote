import React, { useState, useEffect } from 'react';
import { Calendar, Clock, StickyNote, CreditCard as Edit3, Send, CheckCircle, Share2, Sparkles, RefreshCw, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article, UserProfile, UserNote } from '../types';
import { showToast } from './ui/Toast';
import NoteCardGenerator from './NoteCardGenerator';

interface ArticleViewProps {
  article: Article | null;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
}

type NoteStep = 'prompt' | 'loading' | 'selecting' | 'submitting';

export default function ArticleView({ article, userProfile, onProfileUpdate }: ArticleViewProps) {
  const [noteStep, setNoteStep] = useState<NoteStep>('prompt');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [hasNoteToday, setHasNoteToday] = useState(false);
  const [savedNote, setSavedNote] = useState<UserNote | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (article && userProfile) {
      checkTodayNote();
    }
  }, [article, userProfile]);

  const checkTodayNote = async () => {
    if (!article || !userProfile) return;
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('article_id', article.id)
        .maybeSingle();

      setHasNoteToday(!!data && !error);
      if (data && !error) setSavedNote(data);
    } catch (error) {
      console.error('Error checking today\'s note:', error);
    }
  };

  const fetchSuggestions = async () => {
    if (!article) return;
    setNoteStep('loading');
    setSelectedSuggestion(null);
    setShowCustom(false);
    setCustomText('');

    try {
      const { data, error } = await supabase.functions.invoke('generate-action-suggestions', {
        body: {
          article_title: article.title,
          article_subtitle: article.subtitle || '',
          key_takeaways: article.key_takeaways || [],
          article_content: article.content || '',
        },
      });

      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setNoteStep('selecting');
      } else {
        throw new Error('No suggestions returned');
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      // Fallback: use key takeaways to generate specific suggestions
      const takeaways = article.key_takeaways || [];
      const fallback = takeaways.length >= 2
        ? [
            `I will tell at least one person in my life about this: "${takeaways[0]}"`,
            `I'll look up one brand, product, or habit related to ${article.title} and make a more sustainable swap.`,
            `I will make one concrete change inspired by this article and stick to it for the next month.`,
          ]
        : [
            `I'll look up one specific product or habit related to ${article.title} and find a sustainable alternative.`,
            `I will talk to someone at home about what I learned from this article and suggest one change we can make together.`,
            `I'll find one thing in my daily routine connected to ${article.title} and commit to changing it this week.`,
          ];
      setSuggestions(fallback);
      setNoteStep('selecting');
    }
  };

  const getFinalNote = (): string => {
    if (showCustom) return customText.trim();
    return selectedSuggestion || '';
  };

  const handleSubmitNote = async () => {
    const finalNote = getFinalNote();
    if (!finalNote || !article || !userProfile) return;

    setNoteStep('submitting');
    try {
      const { data: noteData, error: noteError } = await supabase
        .from('user_notes')
        .insert({
          user_id: userProfile.id,
          article_id: article.id,
          content: finalNote,
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Fire-and-forget AI impact classification
      if (noteData) {
        supabase.functions.invoke('classify-note-impact', {
          body: {
            note_id: noteData.id,
            note_content: noteData.content,
            user_id: userProfile.id,
          },
        }).catch(err => console.error('Impact classification failed (non-critical):', err));
      }

      const newStreak = userProfile.streak + 1;
      const newTotalNotes = userProfile.total_notes + 1;

      const { data: updatedProfile, error: profileError } = await supabase
        .from('user_profiles')
        .update({
          streak: newStreak,
          total_notes: newTotalNotes,
          last_note_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', userProfile.id)
        .select()
        .single();

      if (profileError) throw profileError;

      onProfileUpdate(updatedProfile);
      setSavedNote(noteData);
      setHasNoteToday(true);
      setNoteStep('prompt');
      showToast(`Note saved! ${newStreak} day streak! 🔥`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
      setNoteStep('selecting');
    }
  };

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">No article for today</h2>
          <p className="text-gray-600">Check back tomorrow for fresh environmental insights!</p>
        </div>
      </div>
    );
  }

  const canSubmit = showCustom ? customText.trim().length > 0 : selectedSuggestion !== null;

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12">
      {/* Article Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{new Date(article.published_date).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}</span>
            <span className="sm:hidden">{new Date(article.published_date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{article.reading_time} min</span>
          </div>
          {article.category && (
            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
              {article.category}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
            {article.subtitle}
          </p>
        )}
      </div>

      {/* Article Content */}
      <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none mb-8 sm:mb-12 article-content">
        <div
          dangerouslySetInnerHTML={{ __html: article.content }}
          className="text-gray-800 leading-relaxed [&_img]:w-full [&_img]:rounded-lg [&_img]:my-4 sm:[&_img]:my-6 [&_img]:shadow-md"
        />
      </div>

      {/* Key Takeaways */}
      {article.key_takeaways && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            <h3 className="font-semibold text-sm sm:text-base text-yellow-800">Key Takeaways</h3>
          </div>
          <ul className="space-y-2">
            {article.key_takeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm sm:text-base text-yellow-900">
                <span className="text-yellow-600 mt-1">•</span>
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Statistics */}
      {article.key_statistics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <h3 className="font-semibold text-sm sm:text-base text-blue-800">By the Numbers</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {article.key_statistics.map((stat, index) => (
              <div key={index} className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
                <p className="text-sm sm:text-base text-blue-900 leading-relaxed font-medium">
                  {stat}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note Card Generator Modal */}
      {showShareCard && savedNote && userProfile && (
        <NoteCardGenerator
          note={{ ...savedNote, article_title: article.title }}
          userProfile={userProfile}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Action Note Section */}
      <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 sm:p-6" id="action-note-section">

        {/* ── Already done ── */}
        {hasNoteToday ? (
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center space-x-2 text-emerald-600">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-semibold text-base sm:text-lg">Note Complete for Today!</span>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              Great job! Visit your Notebook to see what others are doing to make a difference.
            </p>
            {savedNote && userProfile && (
              <button
                onClick={() => setShowShareCard(true)}
                className="inline-flex items-center gap-2 border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" />
                Share your note
              </button>
            )}
          </div>

        /* ── Initial prompt ── */
        ) : noteStep === 'prompt' ? (
          <div className="text-center space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">What will you do differently?</h3>
            <p className="text-sm sm:text-base text-gray-600">
              Pick an action inspired by today's article — or write your own.
            </p>
            <button
              onClick={fetchSuggestions}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base"
            >
              <Edit3 className="w-4 h-4" />
              <span>Write My Action Note</span>
            </button>
          </div>

        /* ── Loading suggestions ── */
        ) : noteStep === 'loading' ? (
          <div className="text-center py-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-medium text-sm">Generating ideas for you…</span>
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>

        /* ── Selecting / writing ── */
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Choose your action</h3>
              <button
                onClick={fetchSuggestions}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
                title="Regenerate suggestions"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>

            {/* 3 AI suggestions */}
            <p className="text-xs text-gray-400">AI-suggested actions based on this article</p>
            <div className="space-y-2">
              {suggestions.map((s, i) => {
                const isSelected = selectedSuggestion === s && !showCustom;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedSuggestion(s);
                      setShowCustom(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm leading-relaxed ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span>{s}</span>
                    </div>
                  </button>
                );
              })}

              {/* Other / write your own */}
              <button
                onClick={() => {
                  setShowCustom(true);
                  setSelectedSuggestion(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                  showCustom
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    showCustom ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                  }`}>
                    {showCustom && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <PenLine className="w-3.5 h-3.5" />
                    <span className="font-medium">Write my own…</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Custom text area */}
            {showCustom && (
              <textarea
                autoFocus
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="I will… (describe your specific climate action)"
                className="w-full h-28 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
              />
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => setNoteStep('prompt')}
                className="text-gray-500 hover:text-gray-700 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNote}
                disabled={!canSubmit || noteStep === 'submitting'}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                {noteStep === 'submitting' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Save My Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
