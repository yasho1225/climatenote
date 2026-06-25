import React from 'react';

interface FloatingBottomBarProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Fixed bottom sheet for primary CTAs — soft shadow, safe-area aware.
 */
export default function FloatingBottomBar({ children, className = '' }: FloatingBottomBarProps) {
  return (
    <div className={`floating-bottom ${className}`}>
      <div className="floating-bottom__inner">{children}</div>
    </div>
  );
}
