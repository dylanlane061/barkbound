import type { CSSProperties, ReactNode } from 'react';

// Decorative stylized topo map (SVG contour rings, water, route dashes). Used
// as the faint backdrop behind the Discover search empty state, and as a
// graceful fallback when the real Google map can't load (no API key).
export default function TerrainMap({
  h = 400,
  rounded = 0,
  route,
  children,
  style,
}: {
  h?: number | string;
  rounded?: number;
  route?: string;
  children?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: 'relative',
        height: h,
        borderRadius: rounded,
        overflow: 'hidden',
        background: 'var(--terrain-green)',
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}
      >
        <rect width="400" height="400" fill="var(--terrain-green)" />
        <path d="M0 0 H400 V150 Q 320 180 250 150 T 90 170 Q 30 180 0 150 Z" fill="var(--terrain-sand)" opacity="0.85" />
        <path d="M0 300 Q 90 270 170 300 T 400 290 V400 H0 Z" fill="var(--terrain-green-2)" opacity="0.7" />
        <ellipse cx="320" cy="330" rx="120" ry="70" fill="var(--terrain-water)" opacity="0.8" />
        {([[110, 90, 1], [300, 120, 0.8], [70, 250, 0.9]] as const).map(([cx, cy, s], i) => (
          <g key={i} opacity="0.5">
            {[18, 34, 52, 72].map((rr, j) => (
              <ellipse
                key={j}
                cx={cx}
                cy={cy}
                rx={rr * s}
                ry={rr * s * 0.7}
                fill="none"
                stroke="var(--contour)"
                strokeWidth="1.1"
                opacity={1 - j * 0.18}
              />
            ))}
          </g>
        ))}
        {[80, 160, 240, 320].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="400" stroke="var(--contour-soft)" strokeWidth="0.6" />
        ))}
        {[80, 160, 240, 320].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="400" y2={y} stroke="var(--contour-soft)" strokeWidth="0.6" />
        ))}
        <path d="M-10 360 Q 120 320 180 250 Q 240 180 360 150 L 420 130" fill="none" stroke="#fff" strokeWidth="7" opacity="0.7" strokeLinecap="round" />
        <path d="M-10 360 Q 120 320 180 250 Q 240 180 360 150 L 420 130" fill="none" stroke="var(--sand-light)" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round" />
        <path d="M250 -10 Q 230 80 270 160 Q 300 240 250 330" fill="none" stroke="var(--terrain-water)" strokeWidth="5" opacity="0.85" strokeLinecap="round" />
        {route && (
          <path d={route} fill="none" stroke="var(--green-800)" strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round" opacity="0.85" />
        )}
      </svg>
      {children}
    </div>
  );
}
