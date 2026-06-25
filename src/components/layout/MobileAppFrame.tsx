import React from 'react';
import ForestBackground from './ForestBackground';

/** `landing` = no frame bg (LandingPage AppShell owns the forest scene); `app` = calm in-app surface; `neutral` = plain cream */
export type FrameBackground = 'landing' | 'app' | 'neutral';

interface MobileAppFrameProps {
  children: React.ReactNode;
  background?: FrameBackground;
}

function FrameBackdrop({ background }: { background: FrameBackground }) {
  if (background === 'landing') return null;
  if (background === 'neutral') {
    return <div className="app-backdrop app-backdrop--neutral pointer-events-none absolute inset-0" aria-hidden />;
  }
  return <ForestBackground variant="app" />;
}

export default function MobileAppFrame({ children, background = 'neutral' }: MobileAppFrameProps) {
  return (
    <div className="native-shell relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <FrameBackdrop background={background} />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
