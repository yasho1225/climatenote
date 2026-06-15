import React from 'react';

/** Decorative leaf SVG — single element */
function LeafShape({
  className,
  flip,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 72"
      fill="currentColor"
      aria-hidden
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M24 4C12 18 4 38 4 58c0 8 6 14 14 14 4 0 8-2 10-5 2 3 6 5 10 5 8 0 14-6 14-14 0-20-8-40-20-54-2-2-4-3-6-3s-4 1-6 3z" opacity="0.9" />
      <path d="M24 12v48" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35" />
    </svg>
  );
}

function FernSprig({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 100" fill="currentColor" aria-hidden>
      <path d="M40 98V20" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4" />
      <ellipse cx="28" cy="32" rx="14" ry="6" transform="rotate(-35 28 32)" opacity="0.7" />
      <ellipse cx="52" cy="40" rx="14" ry="6" transform="rotate(35 52 40)" opacity="0.65" />
      <ellipse cx="26" cy="50" rx="12" ry="5" transform="rotate(-40 26 50)" opacity="0.6" />
      <ellipse cx="54" cy="58" rx="12" ry="5" transform="rotate(40 54 58)" opacity="0.55" />
      <ellipse cx="30" cy="68" rx="10" ry="4.5" transform="rotate(-35 30 68)" opacity="0.5" />
      <ellipse cx="50" cy="76" rx="10" ry="4.5" transform="rotate(35 50 76)" opacity="0.45" />
    </svg>
  );
}

function PlantPot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 80" aria-hidden>
      <path
        d="M32 8c-8 10-14 22-14 34 0 4 2 8 6 10-4 2-6 6-6 10h28c0-4-2-8-6-10 4-2 6-6 6-10 0-12-6-24-14-34z"
        fill="currentColor"
        opacity="0.55"
      />
      <path d="M14 62h36l-4 14H18l-4-14z" fill="currentColor" opacity="0.35" />
      <ellipse cx="32" cy="62" rx="20" ry="4" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

/**
 * Soft botanical accents behind authenticated app screens.
 * Sits under content; does not affect readability.
 */
export default function BotanicalBackground() {
  return (
    <div className="botanical-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="botanical-bg__wash" />

      <LeafShape className="botanical-bg__leaf botanical-bg__leaf--1 text-sage-400" />
      <LeafShape className="botanical-bg__leaf botanical-bg__leaf--2 text-sage-500" flip />
      <LeafShape className="botanical-bg__leaf botanical-bg__leaf--3 text-sage-300" />
      <FernSprig className="botanical-bg__fern botanical-bg__fern--1 text-sage-500" />
      <FernSprig className="botanical-bg__fern botanical-bg__fern--2 text-sage-400" />
      <PlantPot className="botanical-bg__plant botanical-bg__plant--1 text-sage-600" />

      <div className="botanical-bg__dots" />
    </div>
  );
}
