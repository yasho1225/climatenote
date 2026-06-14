import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import AppHeader, { AppTab } from './layout/AppHeader';
import BottomNav from './layout/BottomNav';
import HomeView from './home/HomeView';
import AdminPanel from './AdminPanel';
import WriterPanel from './WriterPanel';
import ArticleReview from './ArticleReview';
import ArticleView from './ArticleView';
import NotebookView from './NotebookView';
import ArchiveView from './ArchiveView';
import GoalsView from './GoalsView';
import ImpactDashboard from './ImpactDashboard';
import LeaderboardView from './LeaderboardView';
import ProfileView from './ProfileView';
import ProfileSettings from './ProfileSettings';
import DeleteAccountScreen from './DeleteAccountScreen';
import NotificationSettings from './NotificationSettings';
import Tutorial from './Tutorial';
import { Article, UserProfile } from '../types';
import { getAppToday } from '../lib/appTimezone';
import { applySavedReminderSchedule, stopWebReminderSchedule } from '../lib/notificationScheduler';
import { showToast } from './ui/Toast';
import { loadFreshUserProfile } from '../lib/profileStats';
import { defaultDisplayNameForUser } from '../lib/publicProfile';
import { scrollAppToTop } from '../lib/scrollToTop';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface DashboardProps {
  session: Session;
}

type Overlay = 'goals' | 'leaderboard' | null;

export default function Dashboard({ session }: DashboardProps) {
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
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
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const isWriter = userProfile?.role === 'writer' || isAdmin;

  useScrollToTop(currentTab);
  useScrollToTop(overlay);
  useScrollToTop(showDeleteAccount);
  useScrollToTop(showProfileSettings);
  useScrollToTop(showAdminPanel);
  useScrollToTop(showNotificationSettings);
  useScrollToTop(selectedArchiveArticle?.id);

  const handleTabChange = (tab: AppTab) => {
    setCurrentTab(tab);
    if (tab !== 'notes') {
      setSelectedArchiveArticle(null);
    }
    scrollAppToTop();
  };

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
        const profile = await loadFreshUserProfile(session.user.id);
        setUserProfile(profile);
      } else {
        try {
          const defaultDisplayName = defaultDisplayNameForUser(session.user);
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              ...(defaultDisplayName ? { display_name: defaultDisplayName } : {}),
              streak: 0,
              total_notes: 0,
            })
            .select()
            .single();

          if (createError) throw createError;
          setUserProfile(newProfile);
          setShowTutorial(true);
        } catch (createError: unknown) {
          const pgError = createError as { code?: string };
          if (pgError.code === '23505') {
            const { data: existingProfile, error: retryError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (retryError) throw retryError;
            const profile = await loadFreshUserProfile(session.user.id);
            setUserProfile(profile);
            if (profile.total_notes === 0) setShowTutorial(true);
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
      <div className="app-page flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 card-glass px-8 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto" />
          <div className="text-sage-600 text-sm">Loading The Climate Note...</div>
        </div>
      </div>
    );
  }

  const headerVariant = currentTab === 'home' ? 'home' : 'title';

  return (
    <div className="app-page">
      <AppHeader
        variant={headerVariant}
        userProfile={userProfile}
        onProfilePress={() => handleTabChange('profile')}
        onNotificationsPress={() => setShowNotificationSettings(true)}
      />

      <main className="app-main pb-24 pt-1" data-scroll-root>
        {currentTab === 'home' && (
          <HomeView
            article={todayArticle}
            userProfile={userProfile}
            onProfileUpdate={setUserProfile}
            onOpenNotes={() => handleTabChange('notes')}
          />
        )}

        {currentTab === 'community' && (
          <NotebookView
            userProfile={userProfile}
            onWriteNote={() => handleTabChange('home')}
          />
        )}

        {currentTab === 'notes' && (
          <div className="max-w-lg mx-auto px-4 pb-6 pt-2">
            {selectedArchiveArticle ? (
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedArchiveArticle(null)}
                  className="mb-4 flex items-center gap-1 text-sage-600 hover:text-forest font-semibold text-sm active:opacity-70"
                >
                  ← Back to archive
                </button>
                <div className="card-surface overflow-hidden">
                  <ArticleView
                    article={selectedArchiveArticle}
                    userProfile={userProfile}
                    onProfileUpdate={setUserProfile}
                    embedded
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="page-title">Archive</h1>
                <ArchiveView onArticleSelect={(article) => {
                  setSelectedArchiveArticle(article);
                  scrollAppToTop();
                }} />
              </>
            )}
          </div>
        )}

        {currentTab === 'impact' && <ImpactDashboard userProfile={userProfile} />}

        {currentTab === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            isAdmin={isAdmin}
            isWriter={isWriter}
            onEditProfile={() => setShowProfileSettings(true)}
            onNotifications={() => setShowNotificationSettings(true)}
            onGoals={() => setOverlay('goals')}
            onLeaderboard={() => setOverlay('leaderboard')}
            onAdminPanel={() => setShowAdminPanel(true)}
            onWriterPanel={() => setShowWriterPanel(true)}
            onArticleReview={() => setShowArticleReview(true)}
            onSignOut={() => supabase.auth.signOut()}
            onDeleteAccount={() => setShowDeleteAccount(true)}
          />
        )}
      </main>

      <BottomNav current={currentTab} onChange={handleTabChange} />

      {overlay === 'goals' && (
        <div className="fixed inset-0 z-50 overflow-y-auto pb-8 app-overlay" data-scroll-root>
          <div className="sticky top-0 app-chrome px-4 py-3 flex items-center gap-3 border-b safe-top">
            <button type="button" onClick={() => setOverlay(null)} className="text-sage-600 font-medium text-sm">
              ← Back
            </button>
            <h2 className="font-bold text-forest">My Goals</h2>
          </div>
          <GoalsView userProfile={userProfile} />
        </div>
      )}

      {overlay === 'leaderboard' && (
        <div className="fixed inset-0 z-50 overflow-y-auto pb-8 app-overlay" data-scroll-root>
          <div className="sticky top-0 app-chrome px-4 py-3 flex items-center gap-3 border-b safe-top">
            <button type="button" onClick={() => setOverlay(null)} className="text-sage-600 font-medium text-sm">
              ← Back
            </button>
            <h2 className="font-bold text-forest">Leaderboard</h2>
          </div>
          <LeaderboardView userProfile={userProfile} />
        </div>
      )}

      {showTutorial && (
        <Tutorial
          onComplete={() => setShowTutorial(false)}
          currentView="article"
          onViewChange={() => setCurrentTab('home')}
        />
      )}

      {showProfileSettings && userProfile && (
        <ProfileSettings
          userProfile={userProfile}
          onClose={() => setShowProfileSettings(false)}
          onProfileUpdate={(updated) => {
            setUserProfile(updated);
            setShowProfileSettings(false);
          }}
          onRequestDeleteAccount={() => {
            setShowProfileSettings(false);
            setShowDeleteAccount(true);
          }}
        />
      )}

      {showDeleteAccount && userProfile && (
        <DeleteAccountScreen
          email={userProfile.email}
          onClose={() => setShowDeleteAccount(false)}
          onDeleted={() => {
            setShowDeleteAccount(false);
            setUserProfile(null);
            supabase.auth.signOut();
          }}
        />
      )}

      {showNotificationSettings && (
        <NotificationSettings onClose={() => setShowNotificationSettings(false)} />
      )}

      {showAdminPanel && (
        <AdminPanel
          onClose={() => {
            setShowAdminPanel(false);
            loadTodayArticle();
          }}
          userId={session.user.id}
          isAdmin={isAdmin}
        />
      )}

      {showWriterPanel && (
        <WriterPanel onClose={() => setShowWriterPanel(false)} userId={session.user.id} />
      )}

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
