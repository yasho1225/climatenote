import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Archive, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article } from '../types';
import ArticleCard, { ArticleCardSkeleton } from './ui/ArticleCard';
import { matchesQuery, stripHtmlToText } from '../lib/searchText';

interface ArchiveViewProps {
  onArticleSelect: (article: Article) => void;
  /** Focus the search field when navigating from the header search button */
  autoFocusSearch?: boolean;
  onSearchFocused?: () => void;
}

function articleSearchText(article: Article): string {
  const parts = [
    article.title,
    article.subtitle,
    article.category,
    stripHtmlToText(article.content),
    ...(article.key_takeaways ?? []),
  ];
  return parts.filter(Boolean).join(' ');
}

export default function ArchiveView({
  onArticleSelect,
  autoFocusSearch = false,
  onSearchFocused,
}: ArchiveViewProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    if (!autoFocusSearch) return;
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      onSearchFocused?.();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [autoFocusSearch, onSearchFocused]);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('published_date', { ascending: false });

      if (error) throw error;

      setArticles(data || []);

      const uniqueCategories = [...new Set((data || [])
        .map((article) => article.category)
        .filter(Boolean),
      )] as string[];

      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const trimmedSearch = searchTerm.trim();

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearchField = matchesQuery(articleSearchText(article), trimmedSearch);
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      return matchesSearchField && matchesCategory;
    });
  }, [articles, trimmedSearch, selectedCategory]);

  const showFeaturedLead = !trimmedSearch && selectedCategory === 'all' && filteredArticles.length > 0;
  const featuredArticle = showFeaturedLead ? filteredArticles[0] : null;
  const listArticles = showFeaturedLead ? filteredArticles.slice(1) : filteredArticles;

  const handleSearchIconClick = () => {
    searchInputRef.current?.focus();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="py-2">
        <div className="app-card p-4 mb-5">
          <ArticleCardSkeleton featured />
        </div>
        <div className="app-card px-3">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[15px] text-ink-muted leading-relaxed mb-5 -mt-1">
        Every story we&apos;ve published — browse, search, and revisit.
      </p>

      <div className="space-y-3 mb-6">
        <div className="relative">
          <button
            type="button"
            onClick={handleSearchIconClick}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-forest transition-colors"
            aria-label="Focus search"
          >
            <Search className="h-4 w-4" />
          </button>
          <input
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stories, topics, categories..."
            className="w-full pl-10 pr-10 py-3 text-[15px] text-ink placeholder:text-ink-muted/60 input-field !pl-10 !pr-10"
            aria-label="Search archive stories"
            enterKeyHint="search"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-forest transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-forest text-white shadow-soft'
                : 'bg-sage-50/90 text-ink-soft border border-sage-200/70'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                selectedCategory === category
                  ? 'bg-forest text-white shadow-soft'
                  : 'bg-sage-50/90 text-ink-soft border border-sage-200/70'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {trimmedSearch && (
        <p className="text-xs text-ink-muted mb-4 -mt-2">
          {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for &ldquo;{trimmedSearch}&rdquo;
        </p>
      )}

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 app-card px-6">
          <Archive className="w-12 h-12 text-sage-300 mx-auto mb-4" />
          <h3 className="text-editorial-title text-lg mb-2">No stories found</h3>
          <p className="text-[15px] text-ink-muted">Try a different search or category.</p>
          {(trimmedSearch || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4 text-sm font-semibold text-forest hover:text-canopy"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {featuredArticle && (
            <div className="app-card p-4 mb-5">
              <ArticleCard
                article={featuredArticle}
                onSelect={onArticleSelect}
                featured
              />
            </div>
          )}

          {listArticles.length > 0 && (
            <section>
              <h2 className="section-title px-1">
                {trimmedSearch
                  ? 'Matching stories'
                  : selectedCategory === 'all'
                    ? 'More stories'
                    : selectedCategory}
              </h2>
              <div className="app-card px-3">
                {listArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onSelect={onArticleSelect}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
