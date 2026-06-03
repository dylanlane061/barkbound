'use client';

import { useId } from 'react';
import type { CSSProperties } from 'react';
import { CATS, type CatKey } from '@/lib/design/cats';
import Icon, { type IconName } from './Icon';

export type PhotoTone = 'green' | 'sand' | 'cool' | 'rust' | 'alpine';

const TONES: Record<PhotoTone, [string, string, string]> = {
  green: ['#e9efe7', '#d4e2d2', 'var(--green-700)'],
  sand: ['#efe5d2', '#e4d4b6', '#a9874f'],
  cool: ['#e2ebe9', '#cfe0de', '#3f766e'],
  rust: ['#f0e2d1', '#e7c4a0', '#b06a39'],
  alpine: ['#e6ebec', '#cdd9da', '#5a6e72'],
};

// Topo-textured placeholder with a centered category glyph. Stands in for real
// imagery (place photos, trip covers) until assets are wired. `useId` keeps the
// SVG pattern id unique without hydration mismatch.
export default function Photo({
  h = 160,
  w = '100%',
  cat,
  glyph,
  label,
  round = 0,
  tone = 'green',
  style,
}: {
  h?: number | string;
  w?: number | string;
  cat?: CatKey;
  glyph?: IconName;
  label?: string;
  round?: number;
  tone?: PhotoTone;
  style?: CSSProperties;
}) {
  const rawId = useId().replace(/:/g, '');
  const patternId = `topo${rawId}`;
  const tones = TONES[tone] ?? TONES.green;
  const glyphName: IconName | null = glyph ?? (cat ? CATS[cat].icon : null);

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: round,
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${tones[0]}, ${tones[1]})`,
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id={patternId}
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(8)"
          >
            <path d="M-10 30 Q 15 10 30 30 T 70 30" fill="none" stroke={tones[2]} strokeWidth="1" opacity="0.16" />
            <path d="M-10 45 Q 15 25 30 45 T 70 45" fill="none" stroke={tones[2]} strokeWidth="1" opacity="0.11" />
            <path d="M-10 15 Q 15 -5 30 15 T 70 15" fill="none" stroke={tones[2]} strokeWidth="1" opacity="0.11" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      {glyphName && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
          }}
        >
          <Icon
            name={glyphName}
            size={typeof h === 'number' ? Math.min(h * 0.32, 44) : 42}
            color={tones[2]}
            stroke={1.4}
          />
        </div>
      )}
      {label && (
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: tones[2],
            background: 'rgba(255,255,255,0.7)',
            padding: '3px 7px',
            borderRadius: 5,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
