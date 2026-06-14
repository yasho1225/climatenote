import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface MobileAppFrameProps {
  children: React.ReactNode;
}

function shouldUseFrame(): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (typeof window !== 'undefined' && window.innerWidth < 420) return false;
  return true;
}

export default function MobileAppFrame({ children }: MobileAppFrameProps) {
  const [useFrame, setUseFrame] = useState(shouldUseFrame);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const onResize = () => setUseFrame(window.innerWidth >= 420);

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!useFrame) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black flex justify-center">
      <div className="mobile-frame-viewport relative w-full max-w-[390px] min-h-screen bg-cream [transform:translateZ(0)]">
        {children}
      </div>
    </div>
  );
}
