import React, { useEffect, useState } from 'react';
import { Mail, ArrowRight, Lock, Leaf } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { getAuthRedirectUrl } from '../lib/authRedirect';
import { openInAppOAuth } from '../lib/nativeOAuth';
import {
  getEnabledOAuthProviders,
  getOAuthProviderSetupMessage,
  type EnabledOAuthProviders,
  type OAuthProvider,
} from '../lib/authProviders';
import { showToast } from './ui/Toast';
import AppShell from './ui/AppShell';
import GradientButton from './ui/GradientButton';
import FloatingBottomBar from './layout/FloatingBottomBar';
import { useScrollToTop } from '../hooks/useScrollToTop';

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

type Step = 'welcome' | 'auth';

export default function LandingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthProviders, setOauthProviders] = useState<EnabledOAuthProviders>({
    google: false,
    apple: false,
  });
  const [oauthReady, setOauthReady] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  useScrollToTop(step);

  useEffect(() => {
    getEnabledOAuthProviders().then((providers) => {
      setOauthProviders(providers);
      setOauthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!isNative) return;

    const onAuthComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ ok: boolean; error?: string }>).detail;
      setLoading(false);
      if (detail?.ok) {
        showToast('Signed in successfully!', 'success');
      } else if (detail?.error) {
        showToast(`Sign-in failed: ${detail.error}`, 'error');
      }
    };

    const onBrowserClosed = () => setLoading(false);

    window.addEventListener('native-auth-complete', onAuthComplete);
    window.addEventListener('native-oauth-browser-closed', onBrowserClosed);
    return () => {
      window.removeEventListener('native-auth-complete', onAuthComplete);
      window.removeEventListener('native-oauth-browser-closed', onBrowserClosed);
    };
  }, [isNative]);

  const handleSocialAuth = async (provider: OAuthProvider) => {
    if (loading) return;
    if (!oauthProviders[provider]) {
      showToast(getOAuthProviderSetupMessage(provider), 'error');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(),
          skipBrowserRedirect: isNative,
          ...(provider === 'apple' ? { scopes: 'name email' } : {}),
        },
      });
      if (error) throw error;
      if (data.url) {
        if (isNative) {
          await openInAppOAuth(data.url);
          return;
        }
        window.location.href = data.url;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      showToast(`Failed to sign in with ${provider}: ${message}`, 'error');
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!showForgotPassword && !password)) return;
    if (!showForgotPassword && password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      if (showForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: isNative
            ? getAuthRedirectUrl('/auth/reset-password')
            : getAuthRedirectUrl('/reset-password'),
        });
        if (error) throw error;
        showToast('Password reset email sent!', 'success');
        setShowForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Welcome back!', 'success');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: getAuthRedirectUrl() },
        });
        if (error) throw error;
        showToast('Welcome! Setting up your account...', 'success');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('User already registered') || message.includes('user_already_exists')) {
        showToast('This email is already registered. Please log in.', 'error');
        setIsLogin(true);
      } else if (message.includes('Invalid login credentials')) {
        showToast('Invalid email or password.', 'error');
      } else {
        showToast(message || 'Authentication failed.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <AppShell forestVariant="full" className="max-w-md mx-auto">
        <div className="relative flex flex-col min-h-screen px-6 pb-44">
          <header className="pt-14 pb-8 safe-top">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Leaf className="w-[18px] h-[18px] text-cream" strokeWidth={2.25} />
              </div>
              <span className="text-sm font-semibold tracking-wide text-on-forest">The Climate Note</span>
            </div>
          </header>

          <main className="flex-1 flex flex-col justify-center gap-10 -mt-6">
            <div className="space-y-4">
              <h1 className="font-serif text-[2.25rem] leading-[1.1] font-medium text-on-forest tracking-tight">
                Small actions,<br />big change.
              </h1>
              <p className="text-[15px] text-cream/80 leading-relaxed max-w-[280px]">
                One short story a day. One habit you can actually keep.
              </p>
            </div>

            <div className="card-glass p-6">
              <p className="text-[10px] font-bold tracking-[0.18em] text-sage-600 uppercase mb-3">
                Daily climate note
              </p>
              <blockquote className="font-serif text-[1.25rem] leading-snug text-forest font-medium">
                &ldquo;Nature does not hurry, yet everything is accomplished.&rdquo;
              </blockquote>
            </div>
          </main>
        </div>

        <FloatingBottomBar>
          <GradientButton onClick={() => { setStep('auth'); setIsLogin(false); }}>
            Get started
            <ArrowRight className="w-5 h-5" />
          </GradientButton>
          <button
            type="button"
            onClick={() => { setStep('auth'); setIsLogin(true); }}
            className="btn-ghost mt-2"
          >
            I already have an account
          </button>
          <div className="pt-3 flex justify-center gap-5 text-xs text-sage-400">
            <a href="/privacy-policy" className="hover:text-sage-600 transition-colors">Privacy</a>
            <a href="/terms-of-service" className="hover:text-sage-600 transition-colors">Terms</a>
          </div>
        </FloatingBottomBar>
      </AppShell>
    );
  }

  return (
    <div className="relative max-w-md mx-auto flex flex-col min-h-screen px-6 py-8 pb-10">
      <button
          type="button"
          onClick={() => setStep('welcome')}
          className="text-sm text-sage-600 hover:text-forest mb-8 self-start transition-colors"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="page-title">
            {showForgotPassword ? 'Reset password' : isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-sage-600 leading-relaxed">
            {showForgotPassword
              ? 'We\'ll send a reset link to your email.'
              : isLogin
                ? 'Sign in to pick up your streak.'
                : 'Join free — takes under a minute.'}
          </p>
        </div>

        <div className="card-surface p-6 space-y-5 flex-1">
          {!showForgotPassword && (
            <>
              {!oauthReady ? (
                <>
                  <div className="h-12 rounded-2xl bg-sage-50 animate-pulse" />
                  <div className="h-12 rounded-2xl bg-sage-50 animate-pulse" />
                </>
              ) : (
                <>
                  {oauthProviders.google && (
                    <button
                      type="button"
                      onClick={() => handleSocialAuth('google')}
                      disabled={loading}
                      className="btn-outline"
                    >
                      <GoogleIcon />
                      Continue with Google
                    </button>
                  )}
                  {oauthProviders.apple && (
                    <button
                      type="button"
                      onClick={() => handleSocialAuth('apple')}
                      disabled={loading}
                      className="btn-primary !bg-forest !bg-none"
                    >
                      <AppleIcon />
                      Sign in with Apple
                    </button>
                  )}
                </>
              )}

              {(oauthProviders.google || oauthProviders.apple) && oauthReady && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-sage-100" />
                  <span className="text-xs text-sage-400">or</span>
                  <div className="flex-1 h-px bg-sage-100" />
                </div>
              )}
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input-field"
                required
              />
            </div>

            {!showForgotPassword && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 8 characters)"
                  className="input-field"
                  required
                  minLength={8}
                />
              </div>
            )}

            {isLogin && !showForgotPassword && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-sage-600 hover:text-forest transition-colors"
              >
                Forgot password?
              </button>
            )}

            <GradientButton type="submit" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {showForgotPassword ? 'Send reset link' : isLogin ? 'Log in' : 'Sign up'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </GradientButton>
          </form>
        </div>
    </div>
  );
}
