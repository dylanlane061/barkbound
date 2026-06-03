import type { Config } from 'tailwindcss';

// Design tokens are defined as :root custom properties in globals.css (ported
// from the design handoff `brand.css`). We mirror them here so Tailwind
// utilities (`bg-green-800`, `rounded-lg`, `shadow-card`, `font-display`…)
// resolve to the same variables. Single source of truth stays the CSS vars.
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        green: {
          900: 'var(--green-900)',
          800: 'var(--green-800)',
          700: 'var(--green-700)',
          600: 'var(--green-600)',
          tint: 'var(--green-tint)',
          'tint-2': 'var(--green-tint-2)',
        },
        orange: {
          DEFAULT: 'var(--orange)',
          bright: 'var(--orange-bright)',
          tint: 'var(--orange-tint)',
        },
        sand: { DEFAULT: 'var(--sand)', light: 'var(--sand-light)' },
        paper: { DEFAULT: 'var(--paper)', 2: 'var(--paper-2)' },
        card: 'var(--card)',
        ink: { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)' },
        muted: 'var(--muted)',
        line: { DEFAULT: 'var(--line)', 2: 'var(--line-2)' },
        // PawSignal confidence tiers
        hi: { DEFAULT: 'var(--hi)', bg: 'var(--hi-bg)', line: 'var(--hi-line)' },
        med: { DEFAULT: 'var(--med)', bg: 'var(--med-bg)', line: 'var(--med-line)' },
        lo: { DEFAULT: 'var(--lo)', bg: 'var(--lo-bg)', line: 'var(--lo-line)' },
        slate: { DEFAULT: 'var(--slate)', bg: 'var(--slate-bg)', line: 'var(--slate-line)' },
      },
      fontFamily: {
        display: 'var(--f-display)',
        body: 'var(--f-body)',
        mono: 'var(--f-mono)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        DEFAULT: 'var(--r)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        pill: 'var(--pill)',
      },
      boxShadow: {
        sm: 'var(--sh-sm)',
        DEFAULT: 'var(--sh)',
        lg: 'var(--sh-lg)',
        pop: 'var(--sh-pop)',
        focus: 'var(--focus)',
      },
      maxWidth: { content: '1280px' },
    },
  },
  plugins: [],
};

export default config;
