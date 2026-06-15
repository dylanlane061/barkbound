import type { CSSProperties, ReactNode } from 'react';

// Centered screen container with the standard 28px gutters and a gentle
// entrance animation. `max` defaults to the 1280px content width; Trip Detail
// uses a narrower 900px column.
export default function Page({
  children,
  max = 1280,
  pad = 28,
  style,
}: {
  children: ReactNode;
  max?: number;
  pad?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="screen-anim"
      style={{ maxWidth: max, margin: '0 auto', padding: `28px ${pad}px 80px`, width: '100%', ...style }}
    >
      {children}
    </div>
  );
}
