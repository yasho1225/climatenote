import React, { useState, useEffect } from 'react';
import { Archive, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Article } from '../types';
import ArticleCard, { ArticleCardSkeleton } from './ui/ArticleCard';

interface ArchiveViewProps {
  onArticleSelect: (article: Article) => void;
}

export default function ArchiveView({ onArticleSelect }: ArchiveViewProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadArticles();
  }, []);

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

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase())
      || article.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const showFeaturedLead = !searchTerm && filteredArticles.length > 0;
  const featuredArticle = showFeaturedLead ? filteredArticles[0] : null;
  const listArticles = showFeaturedLead ? filteredArticles.slice(1) : filteredArticles;

  if (loading) {
    return (
      <div className="py-2">
        <ArticleCardSkeleton featured />
        <div className="rounded-3xl border border-sage-100 bg-white px-3">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[15px] text-forest/55 leading-relaxed mb-5 -mt-1">
        Every story we&apos;ve published — browse, search, and revisit.
      </p>

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search stories..."
            className="w-full pl-10 pr-4 py-3 text-[15px] text-forest placeholder:text-sage-400 bg-white border border-sage-200 rounded-2xl focus:ring-2 focus:ring-sage-400 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-forest text-white'
                : 'bg-white text-forest/80 border border-sage-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-forest text-white'
                  : 'bg-white text-forest/80 border border-sage-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-editorial-title text-lg mb-2">No stories found</h3>
          <p className="text-[15px] text-forest/55">Try a different search or category.</p>
        </div>
      ) : (
        <>
          {featuredArticle && (
            <ArticleCard
              article={featuredArticle}
              onSelect={onArticleSelect}
              featured
            />
          )}

          {listArticles.length > 0 && (
            <section>
              <h2 className="text-editorial-label mb-3 px-1">
                {selectedCategory === 'all' ? 'More stories' : selectedCategory}
              </h2>
              <div className="rounded-3xl border border-sage-100 bg-white px-3 shadow-sm">
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
