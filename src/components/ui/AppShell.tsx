import React from 'react';
import ForestBackground, { ForestBackgroundVariant } from '../layout/ForestBackground';

interface AppShellProps {
  children: React.ReactNode;
  /** Forest backdrop intensity */
  forestVariant?: ForestBackgroundVariant;
  className?: string;
}

/**
 * Shared page wrapper — forest background + readable content layer.
 */
export default function AppShell({
  children,
  forestVariant = 'subtle',
  className = '',
}: AppShellProps) {
  return (
    <div className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      <ForestBackground variant={forestVariant} />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
