import React, { useState, useEffect } from 'react';
import { Target, Plus, X, Check, ChevronRight, Lock, Globe, Flame, Calendar, Trophy, Clock, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from './ui/Toast';
import { UserProfile } from '../types';

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  goal_type: 'streak' | 'action_count' | 'category_specific' | 'custom';
  target_value: number;
  current_progress: number;
  start_date: string;
  end_date: string;
  completed_at?: string;
  status: 'active' | 'completed' | 'failed' | 'paused' | 'pending_decision';
  is_public: boolean;
  category?: string;
  created_at: string;
}

interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  suggested_target: number;
  suggested_duration_days: number;
  category?: string;
  icon: string;
}

interface DecisionGoal {
  goal: Goal;
}

interface GoalsViewProps {
  userProfile: UserProfile | null;
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  streak: 'Daily Streak',
  action_count: 'Action Count',
  category_specific: 'Category Focus',
  custom: 'Custom Goal',
};

export default function GoalsView({ userProfile }: GoalsViewProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [decisionGoal, setDecisionGoal] = useState<DecisionGoal | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'incomplete'>('active');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_type: 'custom' as Goal['goal_type'],
    target_value: 30,
    end_date: '',
    is_public: false,
    category: '',
  });

  useEffect(() => {
    if (userProfile) {
      loadGoals();
      loadTemplates();
    } else {
      setLoading(false);
      setGoals([]);
    }
  }, [userProfile]);

  const loadGoals = async () => {
    if (!userProfile) return;
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);

      // Check for any expired goals that need a decision
      const expired = (data || []).filter(g => g.status === 'pending_decision');
      if (expired.length > 0) setDecisionGoal({ goal: expired[0] });
    } catch (error) {
      console.error('Error loading goals:', error);
      showToast('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_templates')
        .select('*')
        .order('popularity_score', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const applyTemplate = (template: GoalTemplate) => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (template.suggested_duration_days || 30));
    setFormData({
      title: template.title,
      description: template.description,
      goal_type: template.goal_type as Goal['goal_type'],
      target_value: template.suggested_target || 30,
      end_date: endDate.toISOString().split('T')[0],
      is_public: false,
      category: template.category || '',
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    if (!formData.title || !formData.end_date) {
      showToast('Please fill in a title and end date', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('user_goals').insert({
        user_id: userProfile.id,
        title: formData.title,
        description: formData.description || null,
        goal_type: formData.goal_type,
        target_value: formData.target_value,
        current_progress: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: formData.end_date,
        is_public: formData.is_public,
        category: formData.category || null,
        status: 'active',
      });

      if (error) throw error;
      showToast('Goal created! You got this 🌱', 'success');
      setShowCreateForm(false);
      setFormData({ title: '', description: '', goal_type: 'custom', target_value: 30, end_date: '', is_public: false, category: '' });
      loadGoals();
    } catch (error: any) {
      showToast(error.message || 'Failed to create goal', 'error');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase.from('user_goals').delete().eq('id', goalId);
      if (error) throw error;
      showToast('Goal removed', 'success');
      loadGoals();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete goal', 'error');
    }
  };

  const handleDecision = async (decision: 'mark_complete' | 'extend' | 'retry' | 'archive') => {
    if (!decisionGoal) return;
    const { goal } = decisionGoal;

    try {
      let updates: Partial<Goal> = {};

      if (decision === 'mark_complete') {
        updates = { status: 'completed', completed_at: new Date().toISOString() };
      } else if (decision === 'extend') {
        const newEnd = new Date(goal.end_date);
        newEnd.setDate(newEnd.getDate() + 7);
        updates = { status: 'active', end_date: newEnd.toISOString().split('T')[0] };
      } else if (decision === 'retry') {
        const { error: insertError } = await supabase.from('user_goals').insert({
          user_id: goal.user_id,
          title: goal.title,
          description: goal.description,
          goal_type: goal.goal_type,
          target_value: goal.target_value,
          current_progress: 0,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + (new Date(goal.end_date).getTime() - new Date(goal.start_date).getTime())).toISOString().split('T')[0],
          is_public: goal.is_public,
          category: goal.category,
          status: 'active',
        });
        if (insertError) throw insertError;
        updates = { status: 'failed' };
      } else {
        updates = { status: 'failed' };
      }

      const { error: updateError } = await supabase.from('user_goals').update(updates).eq('id', goal.id);
      if (updateError) throw updateError;
      setDecisionGoal(null);
      showToast(decision === 'mark_complete' ? 'Marked as complete! Great effort!' : decision === 'extend' ? 'Goal extended by 7 days!' : decision === 'retry' ? 'Fresh start created!' : 'Goal archived', 'success');
      loadGoals();
    } catch (error: any) {
      showToast(error.message || 'Something went wrong', 'error');
    }
  };

  const getProgressPercent = (goal: Goal) =>
    goal.target_value <= 0
      ? 0
      : Math.min(100, Math.round((goal.current_progress / goal.target_value) * 100));

  const getDaysLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  const filteredGoals = goals.filter(g => {
    if (activeTab === 'active') return g.status === 'active' || g.status === 'pending_decision';
    if (activeTab === 'completed') return g.status === 'completed';
    if (activeTab === 'incomplete') return g.status === 'failed';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-emerald-600">Loading your goals...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-600 text-center">Sign in to view and manage your goals.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* Grace Period Decision Modal */}
      {decisionGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="text-center">
              <div className="text-4xl mb-2">🌱</div>
              <h3 className="text-xl font-bold text-gray-900">Your goal period ended!</h3>
              <p className="text-gray-500 text-sm mt-1">"{decisionGoal.goal.title}"</p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {getProgressPercent(decisionGoal.goal)}% complete
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                {decisionGoal.goal.current_progress} of {decisionGoal.goal.target_value} actions taken
              </p>
              <p className="text-xs text-gray-500 mt-2">
                You showed up — that's what matters 💚
              </p>
            </div>

            <p className="text-sm text-gray-600 text-center">What would you like to do?</p>

            <div className="space-y-3">
              <button onClick={() => handleDecision('mark_complete')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors">
                <Check className="w-5 h-5" />
                <span>Mark as Complete</span>
              </button>
              <button onClick={() => handleDecision('extend')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors">
                <Clock className="w-5 h-5" />
                <span>Extend by 7 Days</span>
              </button>
              <button onClick={() => handleDecision('retry')}
                className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors">
                <RotateCcw className="w-5 h-5" />
                <span>Start Fresh</span>
              </button>
              <button onClick={() => handleDecision('archive')}
                className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors">
                Archive this goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Target className="w-7 h-7 text-emerald-600" />
            <span>My Goals</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">Set and track your environmental commitments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Goal</span>
        </button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Create a New Goal</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateGoal} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g. Go plastic-free for 30 days"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Why is this goal important to you?"
                rows={2}
              />
            </div>

            {/* Target + End Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target (days/actions)</label>
                <input
                  type="number"
                  value={formData.target_value}
                  onChange={e => setFormData(p => ({ ...p, target_value: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="1"
                  max="365"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Visibility Toggle */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                {formData.is_public
                  ? <Globe className="w-5 h-5 text-emerald-600" />
                  : <Lock className="w-5 h-5 text-gray-400" />}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {formData.is_public ? 'Public goal' : 'Private goal'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.is_public ? 'Others can see and get inspired' : 'Only visible to you'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, is_public: !p.is_public }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_public ? 'bg-emerald-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${formData.is_public ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setShowCreateForm(false)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium">
                Create Goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goal Templates */}
      {!showCreateForm && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Need inspiration? Try a template</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => applyTemplate(template)}
                className="bg-white hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-xl p-3 text-left transition-all group"
              >
                <div className="text-2xl mb-1">{template.icon}</div>
                <p className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700 leading-tight">{template.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{template.suggested_duration_days}d</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        {(['active', 'completed', 'incomplete'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${activeTab === tab ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'incomplete' ? 'Incomplete' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-1 text-xs">
              ({goals.filter(g =>
                tab === 'active' ? (g.status === 'active' || g.status === 'pending_decision') :
                tab === 'completed' ? g.status === 'completed' :
                g.status === 'failed'
              ).length})
            </span>
          </button>
        ))}
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="text-5xl">
            {activeTab === 'active' ? '🌱' : activeTab === 'completed' ? '🏆' : '💪'}
          </div>
          <p className="text-gray-500 font-medium">
            {activeTab === 'active'
              ? 'No active goals yet. Create one above or pick a template!'
              : activeTab === 'completed'
              ? "No completed goals yet — keep going!"
              : "No incomplete goals. That's great!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map(goal => {
            const pct = getProgressPercent(goal);
            const daysLeft = getDaysLeft(goal.end_date);

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                {/* Goal Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
                        {GOAL_TYPE_LABELS[goal.goal_type]}
                      </span>
                      {goal.is_public
                        ? <Globe className="w-3.5 h-3.5 text-gray-400" />
                        : <Lock className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <h4 className="font-bold text-gray-900 text-base leading-tight">{goal.title}</h4>
                    {goal.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                  {goal.status === 'active' && (
                    <button onClick={() => handleDeleteGoal(goal.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {goal.status === 'completed' && (
                    <div className="text-2xl">🏆</div>
                  )}
                  {goal.status === 'failed' && (
                    <div className="text-2xl">💪</div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{goal.current_progress} / {goal.target_value} {goal.goal_type === 'streak' ? 'days' : 'actions'}</span>
                    <span className="font-semibold text-gray-700">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ends {new Date(goal.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  {goal.status === 'active' && (
                    <div className={`flex items-center space-x-1 font-medium ${daysLeft <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
                      <Flame className="w-3.5 h-3.5" />
                      <span>{daysLeft === 0 ? 'Last day!' : `${daysLeft} days left`}</span>
                    </div>
                  )}
                  {goal.status === 'completed' && (
                    <span className="text-emerald-600 font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Completed {new Date(goal.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </span>
                  )}
                  {goal.status === 'failed' && (
                    <span className="text-gray-400 font-medium">
                      You completed {pct}% — great effort!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
