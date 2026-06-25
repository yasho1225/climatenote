import React from 'react';
import { Leaf } from 'lucide-react';

interface ConnectionErrorScreenProps {
  onRetry?: () => void;
}

export default function ConnectionErrorScreen({ onRetry }: ConnectionErrorScreenProps) {
  return (
    <div className="flex flex-1 min-h-0 items-center justify-center p-6">
      <div className="max-w-sm app-card p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-sage-100 mx-auto flex items-center justify-center">
          <Leaf className="w-6 h-6 text-forest" aria-hidden />
        </div>
        <h1 className="text-lg font-bold text-ink">Unable to connect</h1>
        <p className="text-sm text-ink-muted leading-relaxed">
          We couldn&apos;t reach our servers. Check your internet connection and try again.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-primary max-w-xs mx-auto"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
