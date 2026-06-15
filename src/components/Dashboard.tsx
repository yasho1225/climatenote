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
import BotanicalBackground from './layout/BotanicalBackground';

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
  const [focusArchiveSearch, setFocusArchiveSearch] = useState(false);

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
      setFocusArchiveSearch(false);
    }
    scrollAppToTop();
  };

  const handleOpenSearch = () => {
    setSelectedArchiveArticle(null);
    setFocusArchiveSearch(true);
    if (currentTab !== 'notes') {
      setCurrentTab('notes');
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
            const { error: retryError } = await supabase
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
      <div className="app-page app-shell flex items-center justify-center">
        <div className="text-center space-y-4 app-card px-8 py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500 mx-auto" />
          <div className="text-ink-muted text-sm font-medium">Loading The Climate Note...</div>
        </div>
      </div>
    );
  }

  const headerVariant = currentTab === 'home' ? 'home' : 'title';

  return (
    <div className="app-page app-shell">
      <BotanicalBackground />
      <AppHeader
        variant={headerVariant}
        userProfile={userProfile}
        onProfilePress={() => handleTabChange('profile')}
        onNotificationsPress={() => setShowNotificationSettings(true)}
        onSearchPress={handleOpenSearch}
        showSearch={!selectedArchiveArticle}
      />

      <main className="app-main pt-1" data-scroll-root>
        {currentTab === 'home' && (
          <HomeView
            article={todayArticle}
            userProfile={userProfile}
            onProfileUpdate={setUserProfile}
          />
        )}

        {currentTab === 'community' && (
          <NotebookView
            userProfile={userProfile}
            onWriteNote={() => handleTabChange('home')}
          />
        )}

        {currentTab === 'notes' && (
          <div className="app-screen !pb-6">
            {selectedArchiveArticle ? (
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedArchiveArticle(null)}
                  className="mb-4 flex items-center gap-1 text-ink-muted hover:text-forest font-semibold text-sm active:opacity-70"
                >
                  ← Back to archive
                </button>
                <div className="app-card overflow-hidden">
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
                <ArchiveView
                  onArticleSelect={(article) => {
                    setSelectedArchiveArticle(article);
                    scrollAppToTop();
                  }}
                  autoFocusSearch={focusArchiveSearch}
                  onSearchFocused={() => setFocusArchiveSearch(false)}
                />
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
          <div className="sticky top-0 bg-sage-50/90 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-sage-200/50 safe-top">
            <button type="button" onClick={() => setOverlay(null)} className="text-ink-muted font-medium text-sm">
              ← Back
            </button>
            <h2 className="font-bold text-ink">My Goals</h2>
          </div>
          <GoalsView userProfile={userProfile} />
        </div>
      )}

      {overlay === 'leaderboard' && (
        <div className="fixed inset-0 z-50 overflow-y-auto pb-8 app-overlay" data-scroll-root>
          <div className="sticky top-0 bg-sage-50/90 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-sage-200/50 safe-top">
            <button type="button" onClick={() => setOverlay(null)} className="text-ink-muted font-medium text-sm">
              ← Back
            </button>
            <h2 className="font-bold text-ink">Leaderboard</h2>
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
