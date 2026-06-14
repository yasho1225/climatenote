import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import ForestBackground from './ForestBackground';

/** `landing` = no frame bg (LandingPage AppShell owns the forest scene); `app` = calm in-app surface; `neutral` = plain cream */
export type FrameBackground = 'landing' | 'app' | 'neutral';

interface MobileAppFrameProps {
  children: React.ReactNode;
  background?: FrameBackground;
}

function shouldUseFrame(): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (typeof window !== 'undefined' && window.innerWidth < 420) return false;
  return true;
}

function FrameBackdrop({ background }: { background: FrameBackground }) {
  if (background === 'landing') return null;
  if (background === 'neutral') {
    return <div className="app-backdrop app-backdrop--neutral pointer-events-none absolute inset-0" aria-hidden />;
  }
  return <ForestBackground variant="app" />;
}

function frameOuterClass(background: FrameBackground): string {
  if (background === 'landing') return 'min-h-screen bg-[var(--forest-bg-deep)]';
  if (background === 'app') return 'min-h-screen bg-[#dce8dc]';
  return 'min-h-screen bg-[var(--neutral-cream)]';
}

export default function MobileAppFrame({ children, background = 'neutral' }: MobileAppFrameProps) {
  const [useFrame, setUseFrame] = useState(shouldUseFrame);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const onResize = () => setUseFrame(window.innerWidth >= 420);

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!useFrame) {
    return (
      <div className="relative min-h-screen">
        <FrameBackdrop background={background} />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div className={`${frameOuterClass(background)} flex justify-center`}>
      <div className="mobile-frame-viewport relative w-full max-w-[390px] min-h-screen [transform:translateZ(0)] overflow-hidden">
        <FrameBackdrop background={background} />
        <div className="relative z-10 min-h-screen">{children}</div>
      </div>
    </div>
  );
}
