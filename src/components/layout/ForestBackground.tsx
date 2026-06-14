import React from 'react';

export type ForestBackgroundVariant = 'full' | 'subtle' | 'app';

interface ForestBackgroundProps {
  /** `full` = animated scene for landing; `subtle` = soft abstract layers; `app` = calm atmospheric in-app */
  variant?: ForestBackgroundVariant;
  className?: string;
}

const TREE_SILHOUETTES = (
  <svg
    className="forest-bg__trees"
    viewBox="0 0 400 120"
    preserveAspectRatio="xMidYMax slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g className="forest-bg__tree forest-bg__tree--1" opacity="0.35">
      <path d="M30 120 L30 70 Q35 55 25 45 Q40 35 30 20 Q45 30 50 45 Q40 55 45 70 L45 120 Z" fill="var(--forest-canopy-dark)" />
    </g>
    <g className="forest-bg__tree forest-bg__tree--2" opacity="0.45">
      <path d="M80 120 L78 60 Q85 45 75 35 Q90 25 85 10 Q100 22 105 38 Q95 50 98 65 L100 120 Z" fill="var(--forest-canopy-mid)" />
    </g>
    <g className="forest-bg__tree forest-bg__tree--3" opacity="0.55">
      <path d="M140 120 L138 55 Q148 40 135 28 Q155 18 150 5 Q168 15 172 32 Q160 45 165 60 L168 120 Z" fill="var(--forest-canopy-dark)" />
    </g>
    <g className="forest-bg__tree forest-bg__tree--4" opacity="0.4">
      <path d="M200 120 L198 65 Q208 50 195 40 Q215 30 210 15 Q225 25 230 42 Q218 55 222 70 L225 120 Z" fill="var(--forest-canopy-mid)" />
    </g>
    <g className="forest-bg__tree forest-bg__tree--5" opacity="0.5">
      <path d="M260 120 L258 58 Q268 42 255 30 Q275 20 270 8 Q288 18 292 35 Q280 48 285 63 L290 120 Z" fill="var(--forest-canopy-dark)" />
    </g>
    <g className="forest-bg__tree forest-bg__tree--6" opacity="0.38">
      <path d="M320 120 L318 62 Q328 48 315 38 Q335 28 330 12 Q345 22 350 38 Q338 52 342 68 L348 120 Z" fill="var(--forest-canopy-mid)" />
    </g>
    <g className="forest-bg__tree forest-bg__tree--7" opacity="0.42">
      <path d="M370 120 L368 68 Q378 52 365 42 Q385 32 380 18 Q395 28 398 44 Q388 58 392 72 L400 120 Z" fill="var(--forest-canopy-dark)" />
    </g>
  </svg>
);

/**
 * GPU-friendly forest backdrop — CSS transforms & opacity only.
 * Respects prefers-reduced-motion via global CSS overrides.
 */
export default function ForestBackground({
  variant = 'subtle',
  className = '',
}: ForestBackgroundProps) {
  const isFull = variant === 'full';
  const isApp = variant === 'app';

  return (
    <div
      className={[
        'forest-bg pointer-events-none absolute inset-0 overflow-hidden',
        isApp ? 'forest-bg--app' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      {/* Base gradient layers */}
      <div className="forest-bg__gradient" />
      <div className="forest-bg__glow forest-bg__glow--left" />
      <div className="forest-bg__glow forest-bg__glow--right" />

      {/* App-only soft canopy wash & horizon */}
      {isApp && (
        <>
          <div className="forest-bg__atmosphere" />
          <div className="forest-bg__horizon" />
        </>
      )}

      {/* Organic foliage blobs */}
      <div className="forest-bg__blob forest-bg__blob--1" />
      <div className="forest-bg__blob forest-bg__blob--2" />
      <div className="forest-bg__blob forest-bg__blob--3" />
      {isApp && <div className="forest-bg__blob forest-bg__blob--4" />}

      {/* Light rays — landing only */}
      <div className={`forest-bg__rays ${isFull ? 'forest-bg__rays--active' : ''}`}>
        <div className="forest-bg__ray forest-bg__ray--1" />
        <div className="forest-bg__ray forest-bg__ray--2" />
        <div className="forest-bg__ray forest-bg__ray--3" />
      </div>

      {/* Floating particles — landing only */}
      {isFull && (
        <div className="forest-bg__particles">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="forest-bg__particle"
              style={{
                left: `${8 + (i * 7.5) % 84}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${6 + (i % 4) * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle floating motes — calm life in the app shell */}
      {isApp && (
        <div className="forest-bg__particles forest-bg__particles--app">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="forest-bg__particle forest-bg__particle--app"
              style={{
                left: `${10 + (i * 11) % 80}%`,
                animationDelay: `${i * 1.2}s`,
                animationDuration: `${10 + (i % 3) * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Soft light rays — app only, very subtle */}
      {isApp && (
        <div className="forest-bg__rays forest-bg__rays--app">
          <div className="forest-bg__ray forest-bg__ray--1" />
          <div className="forest-bg__ray forest-bg__ray--2" />
        </div>
      )}

      {/* Tree silhouettes — static on app/subtle, swaying on landing */}
      {React.cloneElement(TREE_SILHOUETTES, {
        className: `forest-bg__trees ${isFull ? 'forest-bg__trees--sway' : ''}`,
      })}

      {/* Subtle noise texture for depth */}
      <div className="forest-bg__noise" />
    </div>
  );
}
