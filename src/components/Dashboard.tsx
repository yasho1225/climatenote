import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import Header from './Header';
import AdminPanel from './AdminPanel';
import WriterPanel from './WriterPanel';
import ArticleReview from './ArticleReview';
import ArticleView from './ArticleView';
import NotebookView from './NotebookView';
import ArchiveView from './ArchiveView';
import AboutView from './AboutView';
import GoalsView from './GoalsView';
import ImpactDashboard from './ImpactDashboard';
import LeaderboardView from './LeaderboardView';
import ProfileSettings from './ProfileSettings';
import NotificationSettings from './NotificationSettings';
import Tutorial from './Tutorial';
import { Article, UserProfile } from '../types';
import { getAppToday } from '../lib/appTimezone';
import { applySavedReminderSchedule, stopWebReminderSchedule } from '../lib/notificationScheduler';
import { showToast } from './ui/Toast';

interface DashboardProps {
  session: Session;
}

export default function Dashboard({ session }: DashboardProps) {
  const [currentView, setCurrentView] = useState<'article' | 'notebook' | 'archive' | 'about' | 'goals' | 'impact' | 'leaderboard'>('article');
  const [todayArticle, setTodayArticle] = useState<Article | null>(null);
  const [selectedArchiveArticle, setSelectedArchiveArticle] = useState<Article | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showWriterPanel, setShowWriterPanel] = useState(false);
  const [showArticleReview, setShowArticleReview] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadTodayArticle();
  }, [session]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setUserProfile(data);
      } else {
        // Create profile if it doesn't exist
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              streak: 0,
              total_notes: 0,
            })
            .select()
            .single();

          if (createError) throw createError;
          setUserProfile(newProfile);
          // Show tutorial for new users
          setShowTutorial(true);
        } catch (createError: any) {
          // If profile creation fails due to duplicate key (concurrent creation)
          if (createError.code === '23505') {
            // Retry fetching the existing profile
            const { data: existingProfile, error: retryError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (retryError) throw retryError;
            setUserProfile(existingProfile);
            // Check if user needs tutorial (new user with no notes)
            if (existingProfile.total_notes === 0) {
              setShowTutorial(true);
            }
          } else {
            throw createError;
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      showToast('Failed to load your profile', 'error');
    }
  };

  const loadTodayArticle = async () => {
    try {
      const today = getAppToday();

      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('published_date', today)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      setTodayArticle(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading today\'s article:', error);
      showToast('Failed to load today\'s article', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    void applySavedReminderSchedule();

    const handleAppActive = () => {
      loadTodayArticle();
      loadUserProfile();
    };
    window.addEventListener('app-became-active', handleAppActive);

    return () => {
      stopWebReminderSchedule();
      window.removeEventListener('app-became-active', handleAppActive);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse text-emerald-600">Loading today's story...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userProfile={userProfile}
        currentView={currentView}
        onViewChange={setCurrentView}
        onSignOut={() => supabase.auth.signOut()}
        onNotificationSettings={() => setShowNotificationSettings(true)}
        onAdminPanel={() => setShowAdminPanel(true)}
        onWriterPanel={() => setShowWriterPanel(true)}
        onArticleReview={() => setShowArticleReview(true)}
        onProfileSettings={() => setShowProfileSettings(true)}
      />
      
      <main className="pt-20 sm:pt-24 pb-24 lg:pb-8" id="main-content">
        {currentView === 'article' && (
          <div id="article-content">
            <ArticleView 
              article={todayArticle} 
              userProfile={userProfile}
              onProfileUpdate={setUserProfile}
            />
          </div>
        )}
        {currentView === 'notebook' && (
          <div id="notebook-content">
            <NotebookView userProfile={userProfile} />
          </div>
        )}
        {currentView === 'archive' && (
          <div id="archive-content">
            {selectedArchiveArticle ? (
              <div>
                <button
                  onClick={() => setSelectedArchiveArticle(null)}
                  className="mb-4 text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2"
                >
                  ← Back to Archive
                </button>
                <ArticleView
                  article={selectedArchiveArticle}
                  userProfile={userProfile}
                  onProfileUpdate={setUserProfile}
                />
              </div>
            ) : (
              <ArchiveView onArticleSelect={setSelectedArchiveArticle} />
            )}
          </div>
        )}
        {currentView === 'about' && (
          <div id="about-content">
            <AboutView />
          </div>
        )}
        {currentView === 'goals' && (
          <div id="goals-content">
            <GoalsView userProfile={userProfile} />
          </div>
        )}
        {currentView === 'impact' && (
          <div id="impact-content">
            <ImpactDashboard userProfile={userProfile} />
          </div>
        )}
        {currentView === 'leaderboard' && (
          <div id="leaderboard-content">
            <LeaderboardView userProfile={userProfile} />
          </div>
        )}
      </main>
      
      {/* Tutorial */}
      {showTutorial && (
        <Tutorial
          onComplete={() => setShowTutorial(false)}
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      )}
      
      {/* Profile Settings */}
      {showProfileSettings && userProfile && (
        <ProfileSettings
          userProfile={userProfile}
          onClose={() => setShowProfileSettings(false)}
          onProfileUpdate={(updated) => {
            setUserProfile(updated);
            setShowProfileSettings(false);
          }}
          onAccountDeleted={() => {
            setShowProfileSettings(false);
            supabase.auth.signOut();
          }}
        />
      )}

      {/* Notification Settings */}
      {showNotificationSettings && (
        <NotificationSettings
          onClose={() => setShowNotificationSettings(false)}
        />
      )}
      
      {/* Admin Panel */}
      {showAdminPanel && (
        <AdminPanel
          onClose={() => {
            setShowAdminPanel(false);
            loadTodayArticle();
          }}
          userId={session.user.id}
          isAdmin={userProfile?.role === 'admin'}
        />
      )}

      {/* Writer Panel */}
      {showWriterPanel && (
        <WriterPanel
          onClose={() => setShowWriterPanel(false)}
          userId={session.user.id}
        />
      )}

      {/* Article Review (Admin Only) */}
      {showArticleReview && (
        <ArticleReview
          onClose={() => {
            setShowArticleReview(false);
            loadTodayArticle();
          }}
        />
      )}
    </div>
  );
}