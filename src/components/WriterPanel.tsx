import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, Trash2, Send, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './ui/Toast';
import { Article } from '../types';

interface WriterPanelProps {
  onClose: () => void;
  userId: string;
}

export default function WriterPanel({ onClose, userId }: WriterPanelProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [userId]);

  const loadArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'pending_review' })
        .eq('id', articleId)
        .eq('author_id', userId);

      if (error) throw error;

      showToast('Article submitted for review!', 'success');
      loadArticles();
    } catch (error: any) {
      showToast(error.message || 'Failed to submit article', 'error');
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)
        .eq('author_id', userId);

      if (error) throw error;

      showToast('Draft deleted successfully', 'success');
      loadArticles();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete draft', 'error');
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
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>My Articles</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No articles yet. Create your first article!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="border border-gray-200 rounded-lg p-6 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
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
                          <span>{article.reading_time} min read</span>
                        </span>
                        {article.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {article.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    {article.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSubmitForReview(article.id)}
                          className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <Send className="w-4 h-4" />
                          <span>Submit for Review</span>
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="flex items-center space-x-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                    {article.status === 'pending_review' && (
                      <span className="text-sm text-gray-500 italic">Waiting for admin review...</span>
                    )}
                    {(article.status === 'approved' || article.status === 'published') && (
                      <span className="text-sm text-emerald-600 font-medium">✓ {article.status === 'published' ? 'Published' : 'Approved for publishing'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
