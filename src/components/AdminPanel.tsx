import React, { useState } from 'react';
import { Plus, Save, X, Calendar, Clock, Tag, FileText, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './ui/Toast';
import { normalizeAndSanitizeArticleInput } from '../lib/htmlSanitizer';

interface AdminPanelProps {
  onClose: () => void;
  userId: string;
  isAdmin: boolean;
}

export default function AdminPanel({ onClose, userId, isAdmin }: AdminPanelProps) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    category: '',
    published_date: new Date().toISOString().split('T')[0],
    reading_time: 5,
    is_published: true,
    status: 'draft' as 'draft' | 'pending_review' | 'approved' | 'published',
    key_takeaways: [''],
    auto_publish: false,
    scheduled_publish_date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTakeawayChange = (index: number, value: string) => {
    const newTakeaways = [...formData.key_takeaways];
    newTakeaways[index] = value;
    setFormData(prev => ({
      ...prev,
      key_takeaways: newTakeaways
    }));
  };

  const addTakeaway = () => {
    setFormData(prev => ({
      ...prev,
      key_takeaways: [...prev.key_takeaways, '']
    }));
  };

  const removeTakeaway = (index: number) => {
    if (formData.key_takeaways.length > 1) {
      const newTakeaways = formData.key_takeaways.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        key_takeaways: newTakeaways
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty takeaways
      const cleanTakeaways = formData.key_takeaways.filter(takeaway => takeaway.trim() !== '');

      // Normalize plain image URLs, then sanitize all HTML to prevent stored XSS.
      const processedContent = normalizeAndSanitizeArticleInput(formData.content);

      // Determine status based on admin privileges and checkbox
      let articleStatus = formData.status;
      if (isAdmin && formData.is_published && !formData.auto_publish) {
        articleStatus = 'published';
      } else if (isAdmin && formData.auto_publish) {
        articleStatus = 'approved'; // Auto-publish articles need approved status
      } else if (!isAdmin) {
        articleStatus = 'draft';
      }

      // Prepare article data
      const articleData: any = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        content: processedContent,
        category: formData.category || null,
        published_date: formData.published_date,
        reading_time: formData.reading_time,
        is_published: formData.is_published && isAdmin && !formData.auto_publish,
        status: articleStatus,
        author_id: userId,
        key_takeaways: cleanTakeaways.length > 0 ? cleanTakeaways : null
      };

      // Add scheduling fields if auto-publish is enabled
      if (isAdmin && formData.auto_publish && formData.scheduled_publish_date) {
        articleData.auto_publish = true;
        articleData.scheduled_publish_date = formData.scheduled_publish_date;
        articleData.scheduled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('articles')
        .insert(articleData);

      if (error) throw error;

      let message;
      if (isAdmin && formData.auto_publish) {
        message = `Article scheduled for ${formData.scheduled_publish_date}! It will auto-publish at midnight CST.`;
      } else if (isAdmin && formData.is_published) {
        message = 'Article published successfully!';
      } else if (isAdmin) {
        message = 'Article saved as draft!';
      } else {
        message = 'Article saved as draft! An admin will review it.';
      }

      showToast(message, 'success');
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to save article', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Plus className="w-6 h-6 text-emerald-600" />
            <span>Add New Article</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Article Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter article title..."
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle (Optional)
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => handleInputChange('subtitle', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Brief description or hook..."
            />
          </div>

          {/* Meta Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Publish Date *</span>
              </label>
              <input
                type="date"
                value={formData.published_date}
                onChange={(e) => handleInputChange('published_date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Reading Time (min) *</span>
              </label>
              <input
                type="number"
                value={formData.reading_time}
                onChange={(e) => handleInputChange('reading_time', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="1"
                max="60"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
                <Tag className="w-4 h-4" />
                <span>Category</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select category...</option>
                <option value="Current Issues">Current Issues</option>
                <option value="Daily Actions">Daily Actions</option>
                <option value="Fast Fashion">Fast Fashion</option>
                <option value="Sustainable Living">Sustainable Living</option>
                <option value="Technology & Environment">Technology & Environment</option>
                <option value="Food & Agriculture">Food & Agriculture</option>
                <option value="Climate Science">Climate Science</option>
                <option value="Policy & Politics">Policy & Politics</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <FileText className="w-4 h-4" />
              <span>Article Content * (HTML & Images supported)</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={12}
              placeholder="Write your article content here... You can use HTML tags and paste image URLs directly. Images will be automatically formatted."
              required
            />
            <div className="text-sm text-gray-500 mt-2 space-y-1">
              <p><strong>HTML formatting:</strong> &lt;h2&gt;Title&lt;/h2&gt; &lt;p&gt;Text&lt;/p&gt; &lt;ul&gt;&lt;li&gt;List&lt;/li&gt;&lt;/ul&gt;</p>
              <p><strong>Images:</strong> Just paste image URLs (jpg, png, gif, webp) and they'll be automatically formatted</p>
              <p><strong>Recommended:</strong> Use <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Pexels</a> or <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Unsplash</a> for free stock photos</p>
            </div>
          </div>

          {/* Image Helper Section */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-medium text-emerald-800 mb-2">📸 Adding Images to Your Article</h4>
            <div className="text-sm text-emerald-700 space-y-2">
              <p><strong>Method 1 (Easiest):</strong> Copy image URL from Pexels/Unsplash and paste directly in content</p>
              <p><strong>Method 2:</strong> Use HTML: <code className="bg-white px-1 rounded">&lt;img src="URL" alt="description" /&gt;</code></p>
              <p><strong>Free Image Sources:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><a href="https://www.pexels.com/search/environment/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Pexels Environmental Photos</a></li>
                <li><a href="https://unsplash.com/s/photos/climate-change" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Unsplash Climate Photos</a></li>
                <li><a href="https://www.pexels.com/search/sustainability/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Pexels Sustainability Photos</a></li>
              </ul>
            </div>
          </div>

          {/* Key Takeaways */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
              <List className="w-4 h-4" />
              <span>Key Takeaways</span>
            </label>
            <div className="space-y-2">
              {formData.key_takeaways.map((takeaway, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={takeaway}
                    onChange={(e) => handleTakeawayChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder={`Key takeaway ${index + 1}...`}
                  />
                  {formData.key_takeaways.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTakeaway(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addTakeaway}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors"
              >
                + Add another takeaway
              </button>
            </div>
          </div>

          {/* Publish Options - Only for Admins */}
          {isAdmin && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-emerald-800 mb-2">📅 Publishing Options</h4>

              {/* Publish Immediately */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published && !formData.auto_publish}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('auto_publish', false);
                    }
                    handleInputChange('is_published', e.target.checked);
                  }}
                  disabled={formData.auto_publish}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-gray-700">
                  Publish immediately
                </label>
              </div>

              {/* Schedule for Auto-Publish */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="auto_publish"
                    checked={formData.auto_publish}
                    onChange={(e) => {
                      handleInputChange('auto_publish', e.target.checked);
                      if (e.target.checked) {
                        handleInputChange('is_published', false);
                        // Set default scheduled date to tomorrow
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        handleInputChange('scheduled_publish_date', tomorrow.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="auto_publish" className="text-sm font-medium text-gray-700">
                    Schedule for auto-publish 🤖
                  </label>
                </div>

                {/* Scheduled Date Picker */}
                {formData.auto_publish && (
                  <div className="ml-7 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Schedule publish date (CST timezone)
                    </label>
                    <input
                      type="date"
                      value={formData.scheduled_publish_date}
                      onChange={(e) => handleInputChange('scheduled_publish_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required={formData.auto_publish}
                    />
                    <p className="text-xs text-gray-600">
                      Article will automatically publish at midnight CST on this date
                    </p>
                  </div>
                )}
              </div>

              {/* Helper Text */}
              <div className="text-xs text-emerald-700 bg-white rounded p-3">
                <p><strong>Publish immediately:</strong> Article goes live right now</p>
                <p><strong>Auto-publish:</strong> Article automatically publishes at midnight CST on scheduled date</p>
              </div>
            </div>
          )}

          {/* Writer Notice */}
          {!isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Your article will be saved as a draft and submitted for admin review before publishing.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {loading
                  ? 'Saving...'
                  : isAdmin && formData.auto_publish
                  ? 'Schedule Article'
                  : isAdmin && formData.is_published
                  ? 'Publish Article'
                  : isAdmin
                  ? 'Save Draft'
                  : 'Save Draft'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}