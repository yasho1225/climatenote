import React, { useState } from 'react';
import { Mail, NotebookPen, ArrowRight, Lock } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { signInWithAppleNative, isUserCancel } from '../lib/appleAuth';
import { showToast } from './ui/Toast';

// SVG Icons for social login
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/>
  </svg>
);

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  console.log('LandingPage rendering...');

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      // Native iOS: use the native Sign in with Apple sheet instead of the web
      // OAuth redirect. The redirect flow can't return to the native app (no
      // custom URL scheme / Universal Link is registered), so it would never
      // complete. signInWithAppleNative authenticates Supabase directly.
      if (
        provider === 'apple' &&
        Capacitor.isNativePlatform() &&
        Capacitor.getPlatform() === 'ios'
      ) {
        try {
          await signInWithAppleNative();
          // On success Supabase sets the session; App.tsx's onAuthStateChange
          // re-renders into the Dashboard, so we intentionally leave loading
          // on until this component unmounts.
        } catch (err) {
          if (isUserCancel(err)) {
            // User dismissed the Apple sheet — not an error.
            setLoading(false);
            return;
          }
          console.error('Apple native sign-in error:', err);
          showToast('Failed to sign in with Apple. Please try again.', 'error');
          setLoading(false);
        }
        return;
      }

      if (Capacitor.isNativePlatform()) {
        // On native iOS/Android, use in-app browser (SFSafariViewController)
        // to comply with App Store guideline 4 (no external browser for auth)
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({
            url: data.url,
            presentationStyle: 'popover',
          });
        }
      } else {
        // On web, use default Supabase redirect behavior
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
          },
        });

        if (error) throw error;
      }
      // User will be redirected to provider, then back to app
    } catch (error: any) {
      console.error(`${provider} auth error:`, error);
      showToast(`Failed to sign in with ${provider}. Please try again.`, 'error');
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !showForgotPassword && !password) return;

    if (!showForgotPassword && password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      if (showForgotPassword) {
        // Send password reset email
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appUrl}/reset-password`,
        });

        if (error) throw error;
        showToast('Password reset email sent! Check your inbox.', 'success');
        setShowForgotPassword(false);
      } else if (isLogin) {
        // Sign in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        showToast('Welcome back!', 'success');
      } else {
        // Sign up new user
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        showToast('Welcome! Setting up your account...', 'success');
      }
    } catch (error: any) {
      // Handle specific error cases with user-friendly messages
      if (error.message?.includes('User already registered') || error.message?.includes('user_already_exists')) {
        showToast('This email is already registered. Please log in instead.', 'error');
        // Automatically switch to login mode for better UX
        setIsLogin(true);
      } else if (error.message?.includes('Invalid login credentials')) {
        showToast('Invalid email or password. Please check your credentials.', 'error');
      } else if (error.message?.includes('Email not confirmed')) {
        showToast('Please check your email and click the confirmation link.', 'error');
      } else {
        // Only log unexpected errors to console
        console.error('Unexpected auth error:', error);
        showToast(error.message || 'Authentication failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-12">
          <NotebookPen className="w-12 h-12 text-emerald-600" />
          <h1 className="text-3xl font-bold text-gray-900">The Climate Note</h1>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              {showForgotPassword ? (
                <>
                  Reset your password
                </>
              ) : (
                <>
                  {isLogin ? (
                    <>Welcome back to your climate journey</>
                  ) : (
                    <>
                      Daily climate action,
                      <span className="text-emerald-600"> delivered to your inbox</span>
                    </>
                  )}
                </>
              )}
            </h2>
            {!showForgotPassword && (
              <>
                <p className="text-emerald-700 font-semibold text-lg italic">
                  Environmental issues and solutions — written by the youth, for the youth
                </p>
                <p className="text-gray-600 text-base">
                  {isLogin ? (
                    "Continue your journey of climate action and environmental impact."
                  ) : (
                    "Join our newsletter to discover untold environmental stories and turn reading into action through personalized sustainability notes."
                  )}
                </p>
              </>
            )}
          </div>

          {/* Toggle between Sign Up, Login, and Forgot Password */}
          {!showForgotPassword && (
            <div className="flex items-center justify-center space-x-1 text-sm">
              <button
                onClick={() => {
                  setIsLogin(false);
                  setPassword('');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !isLogin
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign Up
              </button>
              <span className="text-gray-400">|</span>
              <button
                onClick={() => {
                  setIsLogin(true);
                  setPassword('');
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isLogin
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Log In
              </button>
            </div>
          )}

          {/* Social Login Buttons */}
          {!showForgotPassword && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSocialAuth('google')}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-base shadow-md hover:shadow-lg border border-gray-200"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('apple')}
                disabled={loading}
                className="w-full bg-black hover:bg-gray-900 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-base shadow-md hover:shadow-lg"
              >
                <AppleIcon />
                <span>Sign in with Apple</span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-sm">or continue with email</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-lg transition-all"
                required
              />
            </div>

            {!showForgotPassword && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Enter your password" : "Create a password (min 6 characters)"}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-lg transition-all"
                  required
                  minLength={6}
                />
              </div>
            )}

            {/* Forgot Password Link */}
            {isLogin && !showForgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Back to Login Link */}
            {showForgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Back to login
                </button>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-lg shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>
                    {showForgotPassword
                      ? 'Send Reset Email'
                      : isLogin
                        ? 'Log In'
                        : 'Sign Up to Our Newsletter'
                    }
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="text-sm text-gray-500 space-y-2">
            {showForgotPassword ? (
              <p className="text-gray-600 text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            ) : !isLogin ? (
              <>
                <p>✅ Free daily climate newsletter with youth perspectives</p>
                <p>✅ Track your climate action with personal notes</p>
                <p>✅ Join a community of young environmental champions</p>
                <p>✅ Turn reading into real environmental impact</p>
              </>
            ) : (
              <p className="text-gray-600">Welcome back! Enter your credentials to continue your climate journey.</p>
            )}
          </div>
        </div>
        
        {/* Legal Links */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <a 
              href="/privacy-policy" 
              className="hover:text-emerald-600 transition-colors"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="/terms-of-service" 
              className="hover:text-emerald-600 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}