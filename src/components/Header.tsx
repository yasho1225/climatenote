import React, { useState } from 'react';
import { NotebookPen, BookOpen, Archive, LogOut, Flame, Info, Bell, Plus, FileEdit, CheckSquare, Menu, X, Target, BarChart2, Trophy, UserCircle } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  userProfile: UserProfile | null;
  currentView: 'article' | 'notebook' | 'archive' | 'about' | 'goals' | 'impact' | 'leaderboard';
  onViewChange: (view: 'article' | 'notebook' | 'archive' | 'about' | 'goals' | 'impact' | 'leaderboard') => void;
  onSignOut: () => void;
  onNotificationSettings: () => void;
  onAdminPanel: () => void;
  onWriterPanel?: () => void;
  onArticleReview?: () => void;
  onProfileSettings: () => void;
}

export default function Header({ userProfile, currentView, onViewChange, onSignOut, onNotificationSettings, onAdminPanel, onWriterPanel, onArticleReview, onProfileSettings }: HeaderProps) {
  const isAdmin = userProfile?.role === 'admin';
  const isWriter = userProfile?.role === 'writer' || isAdmin;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50" id="header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NotebookPen className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            <h1 className="text-base sm:text-xl font-bold text-gray-900">The Climate Note</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8" id="navigation">
          <button
            onClick={() => onViewChange('article')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'article'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <NotebookPen className="w-4 h-4" />
            <span className="font-medium">Today</span>
          </button>

          <button
            onClick={() => onViewChange('notebook')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'notebook'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">Notebook</span>
          </button>

          <button
            onClick={() => onViewChange('archive')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'archive'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span className="font-medium">Archive</span>
          </button>

          <button
            onClick={() => onViewChange('goals')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'goals'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target className="w-4 h-4" />
            <span className="font-medium">Goals</span>
          </button>

          <button
            onClick={() => onViewChange('impact')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'impact'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span className="font-medium">Impact</span>
          </button>

          <button
            onClick={() => onViewChange('leaderboard')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'leaderboard'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="font-medium">Leaderboard</span>
          </button>

          <button
            onClick={() => onViewChange('about')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              currentView === 'about'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="font-medium">About</span>
          </button>
        </nav>

        {/* User Info */}
        <div className="flex items-center space-x-2 sm:space-x-4" id="user-info">
          {userProfile && (
            <div className="flex items-center space-x-1 sm:space-x-2 bg-orange-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg" id="streak-counter">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500" />
              <span className="font-semibold text-sm sm:text-base text-orange-700">{userProfile.streak}</span>
              <span className="text-xs sm:text-sm text-orange-600 hidden sm:inline">day streak</span>
            </div>
          )}

          <div className="hidden lg:flex items-center space-x-2">
            {isWriter && (
              <button
                onClick={onAdminPanel}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={isAdmin ? "Add Article" : "Create Article"}
              >
                <Plus className="w-4 h-4" />
              </button>
            )}

            {isWriter && onWriterPanel && (
              <button
                onClick={onWriterPanel}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="My Articles"
              >
                <FileEdit className="w-4 h-4" />
              </button>
            )}

            {isAdmin && onArticleReview && (
              <button
                onClick={onArticleReview}
                className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Review Articles"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onProfileSettings}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Profile & Account"
            >
              <UserCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onNotificationSettings}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notification Settings"
            >
              <Bell className="w-4 h-4" />
            </button>

            <button
              onClick={onSignOut}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu - Settings and Actions */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 shadow-xl z-50 max-h-[70vh] overflow-y-auto">
          <nav className="px-4 py-3 space-y-1">
              {isWriter && (
                <button
                  onClick={() => {
                    onAdminPanel();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">{isAdmin ? 'Add Article' : 'Create Article'}</span>
                </button>
              )}

              {isWriter && onWriterPanel && (
                <button
                  onClick={() => {
                    onWriterPanel();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <FileEdit className="w-5 h-5" />
                  <span className="font-medium">My Articles</span>
                </button>
              )}

              {isAdmin && onArticleReview && (
                <button
                  onClick={() => {
                    onArticleReview();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <CheckSquare className="w-5 h-5" />
                  <span className="font-medium">Review Articles</span>
                </button>
              )}

              <button
                onClick={() => {
                  onProfileSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <UserCircle className="w-5 h-5" />
                <span className="font-medium">Profile &amp; Account</span>
              </button>

              <button
                onClick={() => {
                  onNotificationSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="font-medium">Notification Settings</span>
              </button>

              <button
                onClick={() => {
                  onSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
          </nav>
        </div>
      )}
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => onViewChange('article')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              currentView === 'article'
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <NotebookPen className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Today</span>
          </button>

          <button
            onClick={() => onViewChange('notebook')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              currentView === 'notebook'
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <BookOpen className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Notebook</span>
          </button>

          <button
            onClick={() => onViewChange('archive')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              currentView === 'archive'
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <Archive className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Archive</span>
          </button>

          <button
            onClick={() => onViewChange('goals')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              currentView === 'goals'
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <Target className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Goals</span>
          </button>

          <button
            onClick={() => onViewChange('impact')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              currentView === 'impact'
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <BarChart2 className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Impact</span>
          </button>

          <button
            onClick={() => onViewChange('leaderboard')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              currentView === 'leaderboard'
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <Trophy className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Ranks</span>
          </button>

          <button
            onClick={() => onViewChange('about')}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              currentView === 'about'
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <Info className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">About</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-colors flex-1 ${
              isMobileMenuOpen
                ? 'text-emerald-600'
                : 'text-gray-500'
            }`}
          >
            <Menu className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}