import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Calendar, Clock, Tag, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './ui/Toast';
import { Article } from '../types';
import { sanitizeArticleHtml } from '../lib/htmlSanitizer';

interface ArticleReviewProps {
  onClose: () => void;
}

export default function ArticleReview({ onClose }: ArticleReviewProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending_review');
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'published',
          is_published: true
        })
        .eq('id', articleId);

      if (error) throw error;

      showToast('Article approved and published!', 'success');
      loadArticles();
      setSelectedArticle(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to approve article', 'error');
    }
  };

  const handleReject = async (articleId: string) => {
    if (!confirm('Are you sure you want to reject this article? It will be moved back to draft status.')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'draft' })
        .eq('id', articleId);

      if (error) throw error;

      showToast('Article rejected and moved to drafts', 'success');
      loadArticles();
      setSelectedArticle(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to reject article', 'error');
    }
  };

  const handleUnpublish = async (articleId: string) => {
    if (!confirm('Are you sure you want to unpublish this article?')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .update({
          status: 'draft',
          is_published: false
        })
        .eq('id', articleId);

      if (error) throw error;

      showToast('Article unpublished', 'success');
      loadArticles();
      setSelectedArticle(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to unpublish article', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      published: 'bg-emerald-100 text-emerald-700'
    };

    const labels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      approved: 'Approved',
      published: 'Published'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges] || badges.draft}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Article Review</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Articles
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
            <div className="border-r border-gray-200 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filter === 'pending' ? 'No articles pending review' : 'No articles found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedArticle?.id === article.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{article.title}</h3>
                        {getStatusBadge(article.status || 'draft')}
                      </div>
                      {article.subtitle && (
                        <p className="text-gray-600 text-sm mb-2">{article.subtitle}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(article.published_date).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{article.reading_time} min</span>
                        </span>
                        {article.category && (
                          <span className="flex items-center space-x-1">
                            <Tag className="w-4 h-4" />
                            <span>{article.category}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-y-auto p-6 bg-gray-50">
              {selectedArticle ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedArticle.title}</h2>
                      {getStatusBadge(selectedArticle.status || 'draft')}
                    </div>
                    {selectedArticle.subtitle && (
                      <p className="text-lg text-gray-600 mb-4">{selectedArticle.subtitle}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(selectedArticle.published_date).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{selectedArticle.reading_time} min read</span>
                      </span>
                      {selectedArticle.category && (
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                          {selectedArticle.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="prose prose-emerald max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(selectedArticle.content || '') }} />
                  </div>

                  {selectedArticle.key_takeaways && selectedArticle.key_takeaways.length > 0 && (
                    <div className="bg-white rounded-lg p-6 border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-3">Key Takeaways</h3>
                      <ul className="space-y-2">
                        {selectedArticle.key_takeaways.map((takeaway, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 pt-6 border-t border-gray-200">
                    {selectedArticle.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleApprove(selectedArticle.id)}
                          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>Approve & Publish</span>
                        </button>
                        <button
                          onClick={() => handleReject(selectedArticle.id)}
                          className="flex items-center space-x-2 border border-red-300 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    {selectedArticle.status === 'published' && (
                      <button
                        onClick={() => handleUnpublish(selectedArticle.id)}
                        className="flex items-center space-x-2 border border-gray-300 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-lg transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Unpublish</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Select an article to review</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
