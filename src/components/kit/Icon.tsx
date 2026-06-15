import type { CSSProperties } from 'react';

// Custom 24×24 line icons (stroke ~1.7), ported verbatim from the design
// handoff's `PATHS` object so glyph metaphors match the mockups exactly.
export const PATHS = {
  trail: 'M7 21c-2 0-3-1.3-3-3s1-3 3-3 3 1.3 3 3-1 2-2.5 2H17c1.4 0 2-.7 2-2s-.8-2-2-2M13 3 8 9',
  trees: 'M12 14v7M8 14a4 4 0 1 1 8 0zM12 3v3M5 21v-4M19 21v-4',
  food: 'M5 3v7a2 2 0 0 0 4 0V3M7 11v10M17 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9',
  beer: 'M5 8h9v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM14 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 8a2 2 0 1 1 4 0M8 11v7M11 11v7',
  hotel: 'M3 20V5M3 20h18M21 20v-7H8M8 13V9h13M3 9h5',
  camp: 'M12 4 3 20h18zM12 4v16',
  dog: 'M10 5.5 8 4 6.5 6 7 9l-2 2v4l2 3h8l2-3v-4l-2-2 .5-3L14 4l-2 1.5zM9 12h.01M13 12h.01',
  park: 'M12 14v7M8 14a4 4 0 1 1 8 0zM12 3v3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
  plus: 'M12 5v14M5 12h14',
  check: 'M20 6 9 17l-5-5',
  pin: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0zM12 10a2.5 2.5 0 1 0 0-.01z',
  bookmark: 'M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  chevron: 'm9 18 6-6-6-6',
  chevronL: 'm15 18-6-6 6-6',
  chevronD: 'm6 9 6 6 6-6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  sliders: 'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z',
  doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  paw: 'M12 14c-2.2 0-4 1.6-4 3.4 0 1.3 1 2.1 2.4 2.1.8 0 1-.4 1.6-.4s.8.4 1.6.4c1.4 0 2.4-.8 2.4-2.1 0-1.8-1.8-3.4-4-3.4zM6.5 11.5a1.6 1.9 0 1 0 0-.01M17.5 11.5a1.6 1.9 0 1 0 0-.01M9.5 8a1.4 1.7 0 1 0 0-.01M14.5 8a1.4 1.7 0 1 0 0-.01',
  share: 'M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13',
  route: 'M6 19a2 2 0 1 0 0-.01M18 5a2 2 0 1 0 0-.01M8 19h6a3 3 0 0 0 3-3V8M16 5h-6a3 3 0 0 0-3 3v8',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  heart: 'M12 20s-7-4.3-9.3-8.3C1.2 9 2.3 5.5 5.5 5.5c1.9 0 3.1 1 4.5 2.7C11.4 6.5 12.6 5.5 14.5 5.5c3.2 0 4.3 3.5 2.8 6.2C19.9 15.7 12 20 12 20z',
  filter: 'M3 5h18l-7 8v5l-4 2v-7z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  x: 'M18 6 6 18M6 6l12 12',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  phone: 'M5 4h5l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v5a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  shield: 'M12 3 5 6v5c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3zM9.5 12l2 2 4-4',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5',
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 20,
  color,
  stroke = 1.7,
  fill,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span className={`ic ${className ?? ''}`} style={{ width: size, height: size, color, ...style }}>
      <svg
        viewBox="0 0 24 24"
        fill={fill || 'none'}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={PATHS[name]} />
      </svg>
    </span>
  );
}
