import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, Send, CheckCircle, Share2, Sparkles, RefreshCw, PenLine, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article, UserProfile, UserNote, ArticleAiInsights } from '../types';
import { showToast } from './ui/Toast';
import NoteCardGenerator from './NoteCardGenerator';
import { ArticleSummaryCard, ArticleFigureSection } from './ArticleInsightsPanel';
import { sanitizeArticleHtml } from '../lib/htmlSanitizer';
import { useRequestGuard } from '../lib/useRequestGuard';
import { refreshUserProfileStats } from '../lib/profileStats';
import {
  fetchArticleInsights,
  getInstantSummaryBullets,
  hasCachedAiInsights,
  hasSupabaseConfig,
} from '../lib/articleInsights';

interface ArticleViewProps {
  article: Article | null;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
  compact?: boolean;
}

type NoteStep = 'prompt' | 'loading' | 'selecting' | 'submitting';

export default function ArticleView({ article, userProfile, onProfileUpdate, compact = false }: ArticleViewProps) {
  const [noteStep, setNoteStep] = useState<NoteStep>('prompt');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');
  const [hasNoteToday, setHasNoteToday] = useState(false);
  const [savedNote, setSavedNote] = useState<UserNote | null>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [insights, setInsights] = useState<ArticleAiInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insightsFromDemo, setInsightsFromDemo] = useState(false);
  const [regeneratingInsights, setRegeneratingInsights] = useState(false);
  const [showFullArticle, setShowFullArticle] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { nextGeneration, isCurrent } = useRequestGuard();

  const summaryBullets = useMemo(
    () => (article ? getInstantSummaryBullets(article, insights) : []),
    [article, insights],
  );

  const canEnhanceWithAi = Boolean(
    article &&
      hasSupabaseConfig() &&
      !hasCachedAiInsights(article) &&
      !insights?.choices?.length,
  );

  const showAiEnhanceOption = Boolean(article && hasSupabaseConfig());

  const resetNoteState = useCallback(() => {
    setNoteStep('prompt');
    setSuggestions([]);
    setSelectedSuggestion(null);
    setShowCustom(false);
    setCustomText('');
    setHasNoteToday(false);
    setSavedNote(null);
    setShowShareCard(false);
    setInsights(null);
    setInsightsLoading(false);
    setInsightsError(null);
    setInsightsFromDemo(false);
    setShowFullArticle(false);
    setShowStats(false);
  }, []);

  useEffect(() => {
    resetNoteState();
    if (article && userProfile) {
      void checkTodayNote();
    }
    if (article?.ai_insights) {
      setInsights(article.ai_insights);
    }
  }, [article?.id, userProfile?.id]);

  const loadInsights = async (forceRegenerate = false): Promise<ArticleAiInsights | null> => {
    if (!article) return null;
    const generation = nextGeneration();
    if (forceRegenerate) {
      setRegeneratingInsights(true);
    } else {
      setInsightsLoading(true);
    }
    setInsightsError(null);

    try {
      const result = await fetchArticleInsights(article, { forceRegenerate });
      if (!isCurrent(generation)) return null;
      setInsights(result.insights);
      setInsightsFromDemo(result.fromDemo);
      return result.insights;
    } catch (err) {
      if (!isCurrent(generation)) return null;
      const message = err instanceof Error ? err.message : 'Failed to load insights';
      setInsightsError(message);
      return null;
    } finally {
      if (isCurrent(generation)) {
        setInsightsLoading(false);
        setRegeneratingInsights(false);
      }
    }
  };

  const handleEnhanceWithAi = () => {
    void loadInsights();
  };

  const checkTodayNote = async () => {
    if (!article || !userProfile) return;
    const generation = nextGeneration();
    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('article_id', article.id)
        .maybeSingle();

      if (!isCurrent(generation)) return;

      setHasNoteToday(!!data && !error);
      if (data && !error) setSavedNote(data);
    } catch (error) {
      console.error('Error checking today\'s note:', error);
    }
  };

  const fetchSuggestions = async (forceRefresh = false) => {
    if (!article) return;
    setNoteStep('loading');
    setSelectedSuggestion(null);
    setShowCustom(false);
    setCustomText('');

    // Use cached AI choices when available; otherwise fetch on demand
    if (!forceRefresh) {
      let cachedChoices = insights?.choices ?? article.ai_insights?.choices;
      if (cachedChoices?.length !== 3) {
        const loaded = await loadInsights();
        cachedChoices = loaded?.choices ?? insights?.choices ?? article.ai_insights?.choices;
      }
      if (cachedChoices?.length === 3) {
        setSuggestions(cachedChoices);
        setNoteStep('selecting');
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-action-suggestions', {
        body: {
          article_id: article.id,
          article_title: article.title,
          article_subtitle: article.subtitle || '',
          key_takeaways: article.key_takeaways || [],
          article_content: article.content || '',
          force_regenerate: forceRefresh,
        },
      });

      if (error) throw error;
      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setNoteStep('selecting');
        return;
      }
      throw new Error('No suggestions returned');
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      // Fallback: use insights or key takeaways
      const fallbackChoices = insights?.choices ?? article.ai_insights?.choices;
      if (fallbackChoices?.length === 3) {
        setSuggestions(fallbackChoices);
        setNoteStep('selecting');
        return;
      }
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

      if (noteError) {
        if (noteError.code === '23505') {
          showToast('You already saved a note for this article.', 'info');
          await checkTodayNote();
          return;
        }
        throw noteError;
      }

      // Fire-and-forget AI impact classification
      if (noteData) {
        supabase.functions.invoke('classify-note-impact', {
          body: {
            note_id: noteData.id,
            note_content: noteData.content,
          },
        }).catch(err => console.error('Impact classification failed (non-critical):', err));
      }

      const updatedProfile = await refreshUserProfileStats(userProfile.id);

      onProfileUpdate(updatedProfile);
      setSavedNote(noteData);
      setHasNoteToday(true);
      setNoteStep('prompt');
      showToast(`Note saved! ${updatedProfile.streak} day streak! 🔥`, 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save note';
      showToast(message, 'error');
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
  const safeArticleContent = sanitizeArticleHtml(article.content || '');

  const shareModal = showShareCard && savedNote && userProfile ? (
    <NoteCardGenerator
      note={{ ...savedNote, article_title: article.title }}
      userProfile={userProfile}
      onClose={() => setShowShareCard(false)}
    />
  ) : null;

  const actionSection = (
    <div className={compact ? '' : 'bg-white border-2 border-sage-200 rounded-3xl p-4 sm:p-6'} id="action-note-section">
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
            <div className="flex gap-2 justify-center">
              <button
                onClick={fetchSuggestions}
                className="inline-flex items-center gap-2 bg-forest hover:bg-forest-light text-white font-semibold px-6 py-3 rounded-full transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                <span>Mark as Done</span>
              </button>
              <button
                type="button"
                className="w-12 h-12 rounded-2xl border border-sage-200 bg-white flex items-center justify-center text-gray-400"
                aria-label="More options"
              >
                <span className="text-lg leading-none">···</span>
              </button>
            </div>
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
                onClick={() => void fetchSuggestions(true)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
                title="Regenerate suggestions"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              AI-generated actions tailored to this article — pick one or write your own.
            </p>

            {/* 3 AI suggestions */}
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
  );

  if (compact) {
    return (
      <div className="px-1">
        {shareModal}
        {actionSection}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12">
      {shareModal}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{new Date(article.published_date).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{article.reading_time} min</span>
          </div>
          {article.category && (
            <span className="bg-sage-100 text-sage-700 px-2 py-1 rounded-full text-xs font-medium">
              {article.category}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-forest leading-tight mb-3">
          {article.title}
        </h1>
        {article.subtitle && summaryBullets.length === 0 && (
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">{article.subtitle}</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <ArticleSummaryCard
          bullets={summaryBullets}
          loading={insightsLoading}
          fromDemo={insightsFromDemo}
          showEnhanceButton={showAiEnhanceOption && (summaryBullets.length === 0 || canEnhanceWithAi)}
          onEnhance={handleEnhanceWithAi}
          onRegenerate={insights?.summary?.length ? () => void loadInsights(true) : undefined}
          regenerating={regeneratingInsights}
        />

        {insightsError && !insights && (
          <p className="text-xs text-amber-700 px-1">{insightsError}</p>
        )}

        <button
          type="button"
          onClick={() => setShowFullArticle((v) => !v)}
          className="w-full flex items-center justify-between rounded-2xl border border-sage-200 bg-white px-4 py-3 text-sm font-semibold text-forest hover:bg-sage-50/60 transition-colors"
        >
          <span>{showFullArticle ? 'Hide full article' : 'Read full article'}</span>
          {showFullArticle ? (
            <ChevronUp className="w-4 h-4 text-sage-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-sage-500" />
          )}
        </button>

        {showFullArticle && (
          <div className="prose prose-sm sm:prose-base max-w-none article-content">
            <div
              dangerouslySetInnerHTML={{ __html: safeArticleContent }}
              className="text-gray-800 leading-relaxed [&_img]:w-full [&_img]:rounded-lg [&_img]:my-4 [&_img]:shadow-md"
            />
          </div>
        )}

        {insights?.figure && (
          <ArticleFigureSection
            figure={insights.figure}
            expanded={showStats}
            onToggle={() => setShowStats((v) => !v)}
          />
        )}

        {!insights?.figure && article.key_statistics && article.key_statistics.length > 0 && (
          <div className="border border-sage-100 rounded-3xl overflow-hidden bg-white shadow-card">
            <button
              type="button"
              onClick={() => setShowStats((v) => !v)}
              className="w-full flex items-center justify-between px-4 sm:px-5 py-3.5 text-left hover:bg-sage-50/50 transition-colors"
            >
              <span className="font-semibold text-sm text-forest">By the numbers</span>
              {showStats ? (
                <ChevronUp className="w-4 h-4 text-sage-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-sage-500" />
              )}
            </button>
            {showStats && (
              <div className="px-4 sm:px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-sage-100 pt-4">
                {article.key_statistics.map((stat, index) => (
                  <div key={index} className="bg-cream rounded-2xl p-4">
                    <p className="text-sm text-forest font-medium">{stat}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {actionSection}
    </div>
  );
}
