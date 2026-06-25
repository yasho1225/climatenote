import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Coffee, NotebookPen } from 'lucide-react';
import { Article, UserProfile } from '../../types';
import ArticleView from '../ArticleView';
import { getInstantSummaryBullets } from '../../lib/articleInsights';

interface HomeViewProps {
  article: Article | null;
  userProfile: UserProfile | null;
  onProfileUpdate: (profile: UserProfile) => void;
}

export default function HomeView({
  article,
  userProfile,
  onProfileUpdate,
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
      <div className="app-screen py-12 text-center">
        <div className="app-card p-8">
          <p className="text-4xl mb-4">🌱</p>
          <h2 className="text-lg font-bold text-ink mb-2">No article for today</h2>
          <p className="text-sm text-ink-muted">Check back tomorrow for a fresh climate story.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-screen space-y-5">
      {/* Daily Climate Note */}
      <div className="app-feature-card">
        <p className="text-[10px] font-bold tracking-[0.14em] text-sage-600 uppercase mb-3">
          Daily Climate Note
        </p>
        <blockquote className="font-serif text-xl sm:text-[1.35rem] font-semibold leading-snug text-ink mb-3">
          &ldquo;{dailyQuote}&rdquo;
        </blockquote>
        {quickSummary.length > 1 && !articleExpanded && (
          <ul className="text-sm text-ink-soft space-y-1.5 mb-3 list-disc list-inside">
            {quickSummary.slice(1, 4).map((bullet, i) => (
              <li key={i} className="leading-snug">{bullet}</li>
            ))}
          </ul>
        )}
        <p className="text-sm text-ink-muted leading-relaxed">
          {quickSummary.length <= 1
            ? 'Small, consistent changes in our daily rhythm create the most lasting ripples for our planet.'
            : 'Tap below for the full story, stats, and your action for today.'}
        </p>
        <button
          type="button"
          onClick={() => setArticleExpanded(!articleExpanded)}
          className="mt-4 flex items-center gap-1 text-sm font-semibold text-forest hover:text-canopy transition-colors"
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
        <div className="app-card overflow-hidden">
          <ArticleView
            article={article}
            userProfile={userProfile}
            onProfileUpdate={onProfileUpdate}
            embedded
          />
        </div>
      )}

      {!articleExpanded && (
        <section id="todays-action">
          <h2 className="section-title">Today&apos;s Action</h2>
          <div className="app-card p-4">
            <div className="flex gap-4 items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-terracotta-light flex items-center justify-center shrink-0">
                <Coffee className="w-6 h-6 text-terracotta" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink text-sm">Bring your own cup</p>
                <p className="text-xs text-ink-muted mt-0.5">Skip the single-use plastic today.</p>
              </div>
            </div>
            <ArticleView
              article={article}
              userProfile={userProfile}
              onProfileUpdate={onProfileUpdate}
              compact
            />
          </div>
        </section>
      )}

      {/* Impact Overview */}
      <section className="relative pb-2">
        <h2 className="section-title">Impact Overview</h2>
        <div className="app-card p-6 flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e4ede4" strokeWidth="10" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#2f4233"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${goalPercent * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-ink">{goalPercent}%</span>
              <span className="text-[10px] text-ink-muted font-medium">Goal</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-ink">{userProfile?.total_notes || 0} actions logged</p>
            <p className="text-sm text-ink-muted mt-1">
              {userProfile?.streak || 0} day streak · keep going!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            document.getElementById('todays-action')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="app-fab absolute -bottom-1 right-0 rounded-2xl"
          aria-label="Jump to today's action"
        >
          <NotebookPen className="w-6 h-6" strokeWidth={2} />
        </button>
      </section>
    </div>
  );
}
