import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Coffee, NotebookPen } from 'lucide-react';
import { Article, UserProfile } from '../../types';
import ArticleView from '../ArticleView';
import { getInstantSummaryBullets } from '../../lib/articleInsights';

interface HomeViewProps {
  article: Article | null;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
  onOpenNotes: () => void;
}

export default function HomeView({
  article,
  userProfile,
  onProfileUpdate,
  onOpenNotes,
}: HomeViewProps) {
  const [articleExpanded, setArticleExpanded] = useState(false);

  const quickSummary = article ? getInstantSummaryBullets(article) : [];
  const dailyQuote =
    quickSummary[0] ||
    article?.subtitle ||
    'Nature does not hurry, yet everything is accomplished.';

  const goalPercent = userProfile
    ? Math.min(100, Math.round((userProfile.total_notes / 30) * 100))
    : 0;

  if (!article) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-4xl p-8 shadow-soft">
          <p className="text-4xl mb-4">🌱</p>
          <h2 className="text-lg font-bold text-forest mb-2">No article for today</h2>
          <p className="text-sm text-gray-500">Check back tomorrow for a fresh climate story.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-6 space-y-5">
      {/* Daily Climate Note card */}
      <div className="bg-gradient-to-br from-sage-300 to-sage-400 rounded-4xl p-6 shadow-soft text-forest-dark">
        <p className="text-[10px] font-bold tracking-widest text-forest/70 uppercase mb-3">
          Daily Climate Note
        </p>
        <blockquote className="font-serif text-xl sm:text-2xl font-semibold leading-snug text-forest mb-3">
          &ldquo;{dailyQuote}&rdquo;
        </blockquote>
        {quickSummary.length > 1 && !articleExpanded && (
          <ul className="text-sm text-forest/85 space-y-1.5 mb-3 list-disc list-inside">
            {quickSummary.slice(1, 4).map((bullet, i) => (
              <li key={i} className="leading-snug">{bullet}</li>
            ))}
          </ul>
        )}
        <p className="text-sm text-forest/80 leading-relaxed">
          {quickSummary.length <= 1
            ? 'Small, consistent changes in our daily rhythm create the most lasting ripples for our planet.'
            : 'Tap below for the full story, stats, and your action for today.'}
        </p>
        <button
          type="button"
          onClick={() => setArticleExpanded(!articleExpanded)}
          className="mt-4 flex items-center gap-1 text-sm font-semibold text-forest hover:text-forest-dark"
        >
          {articleExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" /> Hide full article
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" /> Read today&apos;s story
            </>
          )}
        </button>
      </div>

      {articleExpanded && (
        <div className="bg-white rounded-4xl shadow-card overflow-hidden">
          <ArticleView
            article={article}
            userProfile={userProfile}
            onProfileUpdate={onProfileUpdate}
          />
        </div>
      )}

      {!articleExpanded && (
        <div>
          <h2 className="text-lg font-bold text-forest mb-3">Today&apos;s Action</h2>
          <div className="bg-white rounded-3xl shadow-card p-4">
            <div className="flex gap-4 items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <Coffee className="w-6 h-6 text-earth" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-forest text-sm">Bring your own cup</p>
                <p className="text-xs text-gray-500 mt-0.5">Skip the single-use plastic today.</p>
              </div>
            </div>
            <ArticleView
              article={article}
              userProfile={userProfile}
              onProfileUpdate={onProfileUpdate}
              compact
            />
          </div>
        </div>
      )}

      {/* Impact Overview ring */}
      <div className="relative">
        <h2 className="text-lg font-bold text-forest mb-3">Impact Overview</h2>
        <div className="bg-white rounded-4xl shadow-card p-6 flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e8efe8" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#4a634e"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${goalPercent * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-forest">{goalPercent}%</span>
              <span className="text-[10px] text-gray-500 font-medium">Goal</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-forest">{userProfile?.total_notes || 0} actions logged</p>
            <p className="text-sm text-gray-500 mt-1">
              {userProfile?.streak || 0} day streak · keep going!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenNotes}
          className="absolute -right-1 bottom-4 w-14 h-14 bg-forest rounded-2xl shadow-soft flex items-center justify-center text-white hover:bg-forest-light transition-colors"
          aria-label="Open notes"
        >
          <NotebookPen className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
