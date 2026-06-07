import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import PasswordReset from './components/PasswordReset';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import DemoMode from './components/DemoMode';
import { Toaster } from './components/ui/Toast';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSupabaseConfig, setHasSupabaseConfig] = useState(false);
  const [, setRouteVersion] = useState(0);

  useEffect(() => {
    const refreshRoute = () => setRouteVersion((version) => version + 1);

    window.addEventListener('hashchange', refreshRoute);
    window.addEventListener('popstate', refreshRoute);
    window.addEventListener('app-route-change', refreshRoute);

    return () => {
      window.removeEventListener('hashchange', refreshRoute);
      window.removeEventListener('popstate', refreshRoute);
      window.removeEventListener('app-route-change', refreshRoute);
    };
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const initializeApp = async () => {
      try {
        // Initialize Capacitor deep links before auth (cold-start URLs)
        if (Capacitor.isNativePlatform()) {
          try {
            const { CapacitorApp } = await import('./capacitor-plugins');
            CapacitorApp.initialize();
          } catch {
            console.log('Capacitor not available, running in web mode');
          }
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co') {
          if (!mounted) return;
          setHasSupabaseConfig(true);

          try {
            // Get initial session with timeout
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Session timeout')), 5000)
            );

            const { data: { session } } = await Promise.race([
              sessionPromise,
              timeoutPromise
            ]);

            if (!mounted) return;
            setSession(session);

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
              if (mounted) {
                setSession(session);
              }
            });

            unsubscribe = () => subscription.unsubscribe();
          } catch (authError) {
            console.error('Auth initialization error:', authError);
            if (mounted) {
              setSession(null);
            }
          }
        } else {
          if (mounted) {
            setHasSupabaseConfig(false);
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
        if (mounted) {
          setHasSupabaseConfig(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Handle hash-based routing for legal and native deep-link pages
  const hashPath = window.location.hash.replace('#', '');

  // Check if this is a password reset page
  const isPasswordReset = window.location.pathname === '/reset-password' || 
                          hashPath === '/reset-password' ||
                          window.location.hash.includes('type=recovery');
  
  // Check for legal pages
  const isPrivacyPolicy = window.location.pathname === '/privacy-policy';
  const isTermsOfService = window.location.pathname === '/terms-of-service';
  
  const isPrivacyPolicyHash = hashPath === '/privacy-policy';
  const isTermsOfServiceHash = hashPath === '/terms-of-service';
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <div className="text-emerald-600">Loading The Climate Note...</div>
        </div>
      </div>
    );
  }

  // Show demo mode if no Supabase configuration
  if (!hasSupabaseConfig && !isPasswordReset && !isPrivacyPolicy && !isTermsOfService && !isPrivacyPolicyHash && !isTermsOfServiceHash) {
    return (
      <div className="min-h-screen">
        <DemoMode />
        <Toaster />
      </div>
    );
  }
  
  // Show password reset page if needed
  if (isPasswordReset) {
    return (
      <div className="min-h-screen">
        <PasswordReset />
        <Toaster />
      </div>
    );
  }
  
  // Show privacy policy page
  if (isPrivacyPolicy || isPrivacyPolicyHash) {
    return (
      <div className="min-h-screen">
        <PrivacyPolicy />
        <Toaster />
      </div>
    );
  }
  
  // Show terms of service page
  if (isTermsOfService || isTermsOfServiceHash) {
    return (
      <div className="min-h-screen">
        <TermsOfService />
        <Toaster />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      {!session ? <LandingPage /> : <Dashboard session={session} />}
      <Toaster />
    </div>
  );
}

export default App;