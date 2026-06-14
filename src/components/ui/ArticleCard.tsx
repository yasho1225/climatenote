import { Article } from '../../types';
import {
  getArticleCoverImage,
  getCategoryAccent,
  getCategoryIcon,
} from '../../lib/articleCover';

interface ArticleCardProps {
  article: Article;
  onSelect: (article: Article) => void;
  /** Substack-style hero card for the lead story */
  featured?: boolean;
}

function formatArticleDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function isRecentArticle(date: string, days = 3) {
  const published = new Date(date);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return published >= cutoff;
}

function ArticleMeta({ article, showNew = true }: { article: Article; showNew?: boolean }) {
  const isNew = showNew && isRecentArticle(article.published_date);

  return (
    <p className="text-editorial-meta flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {isNew && (
        <span className="inline-flex items-center gap-1.5 text-sage-700">
          <span className="h-1.5 w-1.5 rounded-full bg-sage-500" aria-hidden />
          New
        </span>
      )}
      <span className="text-sage-500/90">
        {formatArticleDate(article.published_date)}
        <span className="mx-1.5 text-sage-300" aria-hidden>·</span>
        {article.reading_time} min read
      </span>
    </p>
  );
}

function CategoryLabel({ category }: { category?: string }) {
  return (
    <p className="text-editorial-label mb-1.5">
      {category ?? 'The Climate Note'}
    </p>
  );
}

function ArticleThumbnail({ article, size = 'md' }: { article: Article; size?: 'md' | 'lg' }) {
  const coverImage = getArticleCoverImage(article.content);
  const Icon = getCategoryIcon(article.category);
  const accent = getCategoryAccent(article.category);
  const dimensions = size === 'lg' ? 'w-[88px] h-[88px] rounded-2xl' : 'w-[72px] h-[72px] rounded-xl';

  if (coverImage) {
    return (
      <div className={`shrink-0 overflow-hidden bg-sage-100 ${dimensions}`}>
        <img
          src={coverImage}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={`shrink-0 flex items-center justify-center ${dimensions} ${accent}`}>
      <Icon className={size === 'lg' ? 'h-8 w-8' : 'h-7 w-7'} strokeWidth={1.75} aria-hidden />
    </div>
  );
}

function FeaturedArticleCard({ article, onSelect }: { article: Article; onSelect: () => void }) {
  const coverImage = getArticleCoverImage(article.content);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left mb-6 active:opacity-90 transition-opacity"
    >
      {coverImage ? (
        <div className="mb-3 overflow-hidden rounded-2xl aspect-[16/10] bg-sage-100">
          <img
            src={coverImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="mb-3 flex justify-center">
          <ArticleThumbnail article={article} size="lg" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center rounded-full bg-forest/90 px-2.5 py-1 text-xs font-medium text-white">
          Latest story
        </span>
        {isRecentArticle(article.published_date, 1) && (
          <span className="text-xs text-sage-600">
            Just published
          </span>
        )}
      </div>
      <CategoryLabel category={article.category} />
      <h3 className="text-editorial-title text-[1.625rem] leading-[1.28] line-clamp-3 mb-2.5">
        {article.title}
      </h3>
      {article.subtitle && (
        <p className="text-editorial-body text-[15px] line-clamp-3 mb-3.5">
          {article.subtitle}
        </p>
      )}
      <ArticleMeta article={article} />
    </button>
  );
}

function CompactArticleRow({ article, onSelect }: { article: Article; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex gap-3.5 py-4 text-left border-b border-sage-100 last:border-b-0 active:bg-sage-50/60 transition-colors rounded-lg -mx-1 px-1"
    >
      <div className="flex-1 min-w-0">
        <CategoryLabel category={article.category} />
        <h3 className="text-editorial-title text-[1.0625rem] leading-[1.35] line-clamp-2 mb-1.5">
          {article.title}
        </h3>
        {article.subtitle && (
          <p className="text-[14px] text-forest/50 leading-[1.45] line-clamp-1 mb-2">
            {article.subtitle}
          </p>
        )}
        <ArticleMeta article={article} />
      </div>
      <ArticleThumbnail article={article} />
    </button>
  );
}

export default function ArticleCard({ article, onSelect, featured = false }: ArticleCardProps) {
  const handleSelect = () => onSelect(article);

  if (featured) {
    return <FeaturedArticleCard article={article} onSelect={handleSelect} />;
  }

  return <CompactArticleRow article={article} onSelect={handleSelect} />;
}

export function ArticleCardSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <div className="mb-6 space-y-3 animate-pulse">
        <div className="aspect-[16/10] rounded-2xl bg-sage-100" />
        <div className="h-3 w-20 rounded bg-sage-100" />
        <div className="h-7 w-full rounded bg-sage-100" />
        <div className="h-7 w-4/5 rounded bg-sage-100" />
        <div className="h-4 w-32 rounded bg-sage-100" />
      </div>
    );
  }

  return (
    <div className="flex gap-3.5 py-4 animate-pulse">
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-2.5 w-16 rounded bg-sage-100" />
        <div className="h-5 w-full rounded bg-sage-100" />
        <div className="h-4 w-3/4 rounded bg-sage-100" />
        <div className="h-3 w-24 rounded bg-sage-100" />
      </div>
      <div className="h-[72px] w-[72px] shrink-0 rounded-xl bg-sage-100" />
    </div>
  );
}
