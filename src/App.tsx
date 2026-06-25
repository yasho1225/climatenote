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

import ConnectionErrorScreen from './components/ui/ConnectionErrorScreen';

import { Toaster, showToast } from './components/ui/Toast';

import { completeOAuthSignIn } from './lib/oauthCallback';

import { getSupabaseConfigError } from './lib/validateSupabaseConfig';

import { scrollAppToTop } from './lib/scrollToTop';

import { initializeNativeShell, hideNativeSplash } from './lib/nativeShell';

import MobileAppFrame, { FrameBackground } from './components/layout/MobileAppFrame';



function App() {

  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);

  const [hasSupabaseConfig, setHasSupabaseConfig] = useState(false);

  const [configError, setConfigError] = useState<string | null>(null);

  const [routeVersion, setRouteVersion] = useState(0);



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
    scrollAppToTop();
  }, [routeVersion]);



  useEffect(() => {

    let unsubscribe: (() => void) | undefined;

    let mounted = true;



    const initializeApp = async () => {

      try {

        await initializeNativeShell();

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

          const configValidationError = await getSupabaseConfigError();

          if (!mounted) return;



          if (configValidationError) {

            setHasSupabaseConfig(false);

            setConfigError(configValidationError);

            return;

          }



          setHasSupabaseConfig(true);

          setConfigError(null);



          try {

            let oauthResult: { ok: boolean; error?: string } | null = null;

            if (!Capacitor.isNativePlatform()) {

              oauthResult = await completeOAuthSignIn();

            }



            const { data: { session } } = await supabase.auth.getSession();



            if (!mounted) return;

            if (oauthResult?.error && !session) {

              showToast(`Sign-in failed: ${oauthResult.error}`, 'error');

            }

            setSession(session);



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

          void hideNativeSplash();

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

      <MobileAppFrame background="neutral">

        <div className="flex flex-1 min-h-0 items-center justify-center">

          <div className="text-center space-y-4">

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 mx-auto"></div>

            <div className="text-sage-600 text-sm">Loading The Climate Note...</div>

          </div>

        </div>

      </MobileAppFrame>

    );

  }



  // Show demo mode if no Supabase configuration

  if (!hasSupabaseConfig && !isPasswordReset && !isPrivacyPolicy && !isTermsOfService && !isPrivacyPolicyHash && !isTermsOfServiceHash) {

    const isNative = Capacitor.isNativePlatform();

    return (

      <MobileAppFrame background="neutral">

        <div className="flex flex-1 min-h-0 flex-col">

          {isNative || configError || !import.meta.env.DEV ? (

            <ConnectionErrorScreen onRetry={() => window.location.reload()} />

          ) : (

            <DemoMode />

          )}

          <Toaster />

        </div>

      </MobileAppFrame>

    );

  }

  

  // Show password reset page if needed

  if (isPasswordReset) {

    return (

      <MobileAppFrame background="neutral">

        <div className="flex flex-1 min-h-0 flex-col">

          <PasswordReset />

          <Toaster />

        </div>

      </MobileAppFrame>

    );

  }

  

  // Show privacy policy page

  if (isPrivacyPolicy || isPrivacyPolicyHash) {

    return (

      <MobileAppFrame background="neutral">

        <div className="flex flex-1 min-h-0 flex-col">

          <PrivacyPolicy />

          <Toaster />

        </div>

      </MobileAppFrame>

    );

  }

  

  // Show terms of service page

  if (isTermsOfService || isTermsOfServiceHash) {

    return (

      <MobileAppFrame background="neutral">

        <div className="flex flex-1 min-h-0 flex-col">

          <TermsOfService />

          <Toaster />

        </div>

      </MobileAppFrame>

    );

  }

  

  const mainFrameBackground: FrameBackground = session ? 'app' : 'landing';

  return (

    <MobileAppFrame background={mainFrameBackground}>

      <div className="flex flex-1 min-h-0 flex-col">

        {!session ? <LandingPage /> : <Dashboard session={session} />}

        <Toaster />

      </div>

    </MobileAppFrame>

  );

}



export default App;


