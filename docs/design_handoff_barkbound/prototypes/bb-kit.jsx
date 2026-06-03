// ============================================================
//  BARKBOUND — Hi-fi shared kit
// ============================================================
const { useState, useEffect, useRef } = React;

/* ---------------- Icons (line, 24x24, stroke 1.7) ---------------- */
const PATHS = {
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
};
function Ic({ name, size = 20, color, stroke = 1.7, fill, style }) {
  return (
    <span className="ic" style={{ width: size, height: size, color, ...style }}>
      <svg viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        <path d={PATHS[name]} />
      </svg>
    </span>
  );
}

/* ---------------- Brand mark ---------------- */
function Logo({ size = 26, mono }) {
  return (
    <span className="row g8" style={{ alignItems: 'center' }}>
      <span style={{ width: size, height: size, borderRadius: 9, background: mono ? '#fff' : 'var(--green-800)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic name="paw" size={size * 0.62} color={mono ? 'var(--green-800)' : '#fff'} fill={mono ? 'var(--green-800)' : '#fff'} stroke={0} />
      </span>
      <span className="display" style={{ fontWeight: 800, fontSize: size * 0.72, color: mono ? '#fff' : 'var(--green-900)', letterSpacing: '-0.02em' }}>Barkbound</span>
    </span>
  );
}

/* ---------------- Category meta ---------------- */
const CATS = {
  brewery: { icon: 'beer', label: 'Brewery' },
  trail: { icon: 'trail', label: 'Trail' },
  park: { icon: 'park', label: 'Park' },
  restaurant: { icon: 'food', label: 'Restaurant' },
  hotel: { icon: 'hotel', label: 'Hotel' },
  campground: { icon: 'camp', label: 'Campground' },
  dogpark: { icon: 'dog', label: 'Dog Park' },
};
const FILTERS = [
  ['trail', 'Trails'], ['restaurant', 'Restaurants'], ['brewery', 'Breweries'],
  ['hotel', 'Hotels'], ['park', 'Parks'], ['campground', 'Campgrounds'], ['dogpark', 'Dog Parks'],
];

/* confidence helper */
function confOf(score) { return score >= 85 ? 'hi' : score >= 65 ? 'med' : score >= 45 ? 'lo' : 'lo'; }
const CONF_LABEL = { hi: 'High', med: 'Medium', lo: 'Low', slate: 'Verify' };
const CONF_VAR = { hi: 'var(--hi)', med: 'var(--med)', lo: 'var(--lo)', slate: 'var(--slate)' };
function Conf({ level, score, small }) {
  const lv = level || confOf(score);
  return <span className={`conf conf-${lv}`} style={small ? { fontSize: 10, padding: '3px 7px 3px 6px' } : null}>{CONF_LABEL[lv]}</span>;
}

/* ---------------- Score ring (signature) ---------------- */
function ScoreRing({ value = 92, size = 76, stroke = 6, level, label = 'PawSignal', ticks = true }) {
  const lv = level || confOf(value);
  const col = CONF_VAR[lv];
  const r = (size - stroke) / 2 - (ticks ? 4 : 0);
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const tickEls = [];
  if (ticks) {
    const N = 32;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * 2 * Math.PI - Math.PI / 2;
      const on = i / N <= value / 100;
      const ro = size / 2 - 1.5, ri = size / 2 - 4.5;
      tickEls.push(<line key={i} x1={cx + Math.cos(a) * ri} y1={cx + Math.sin(a) * ri}
        x2={cx + Math.cos(a) * ro} y2={cx + Math.sin(a) * ro}
        stroke={on ? col : 'var(--line-2)'} strokeWidth="1.5" strokeLinecap="round" opacity={on ? 0.9 : 0.5} />);
    }
  }
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        {tickEls}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={col} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
        <span className="display" style={{ fontWeight: 800, fontSize: size * 0.34, color: col }}>{value}</span>
        {label && <span style={{ fontSize: size * 0.1, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: size * 0.04, fontWeight: 600 }}>{label}</span>}
      </div>
    </div>
  );
}

/* small score badge for list rows / pins */
function ScoreBadge({ value, size = 44 }) {
  const lv = confOf(value); const col = CONF_VAR[lv];
  return (
    <div style={{ width: size, height: size, borderRadius: 12, background: 'var(--card)', border: `1.5px solid ${col}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--sh-sm)' }}>
      <span className="display" style={{ fontWeight: 800, fontSize: size * 0.4, color: col, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

/* ---------------- Photo placeholder (topo texture + glyph) ---------------- */
let _phc = 0;
function Photo({ h = 160, w = '100%', cat, glyph, label, round = 0, tone = 'green', style }) {
  const id = useRef(++_phc).current;
  const tones = {
    green: ['#e9efe7', '#d4e2d2', 'var(--green-700)'],
    sand: ['#efe5d2', '#e4d4b6', '#a9874f'],
    cool: ['#e2ebe9', '#cfe0de', '#3f766e'],
    rust: ['#f0e2d1', '#e7c4a0', '#b06a39'],
    alpine: ['#e6ebec', '#cdd9da', '#5a6e72'],
  }[tone] || ['#e9efe7', '#d4e2d2', 'var(--green-700)'];
  const glyphName = glyph || (cat ? (CATS[cat]?.icon || 'pin') : null);
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: round, overflow: 'hidden',
      background: `linear-gradient(135deg, ${tones[0]}, ${tones[1]})`, ...style }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`topo${id}`} width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
            <path d="M-10 30 Q 15 10 30 30 T 70 30" fill="none" stroke={tones[2]} strokeWidth="1" opacity="0.16" />
            <path d="M-10 45 Q 15 25 30 45 T 70 45" fill="none" stroke={tones[2]} strokeWidth="1" opacity="0.11" />
            <path d="M-10 15 Q 15 -5 30 15 T 70 15" fill="none" stroke={tones[2]} strokeWidth="1" opacity="0.11" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#topo${id})`} />
      </svg>
      {glyphName && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
        <Ic name={glyphName} size={typeof h === 'number' ? Math.min(h * 0.32, 44) : 42} color={tones[2]} stroke={1.4} />
      </div>}
      {label && <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: tones[2], background: 'rgba(255,255,255,0.7)', padding: '3px 7px', borderRadius: 5 }}>{label}</span>}
    </div>
  );
}

/* ---------------- Terrain map ---------------- */
function TerrainMap({ pins = [], route, h = 400, rounded = 0, compact, children, style }) {
  return (
    <div className="terrain" style={{ position: 'relative', height: h, borderRadius: rounded, overflow: 'hidden', background: 'var(--terrain-green)', ...style }}>
      <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
        {/* terrain regions */}
        <rect width="400" height="400" fill="var(--terrain-green)" />
        <path d="M0 0 H400 V150 Q 320 180 250 150 T 90 170 Q 30 180 0 150 Z" fill="var(--terrain-sand)" opacity="0.85" />
        <path d="M0 300 Q 90 270 170 300 T 400 290 V400 H0 Z" fill="var(--terrain-green-2)" opacity="0.7" />
        <ellipse cx="320" cy="330" rx="120" ry="70" fill="var(--terrain-water)" opacity="0.8" />
        {/* contour clusters */}
        {[[110, 90, 1], [300, 120, 0.8], [70, 250, 0.9]].map(([cx, cy, s], i) => (
          <g key={i} opacity="0.5">
            {[18, 34, 52, 72].map((rr, j) => (
              <ellipse key={j} cx={cx} cy={cy} rx={rr * s} ry={rr * s * 0.7} fill="none" stroke="var(--contour)" strokeWidth="1.1" opacity={1 - j * 0.18} />
            ))}
          </g>
        ))}
        {/* faint grid */}
        {[80, 160, 240, 320].map(x => <line key={'v'+x} x1={x} y1="0" x2={x} y2="400" stroke="var(--contour-soft)" strokeWidth="0.6" />)}
        {[80, 160, 240, 320].map(y => <line key={'h'+y} x1="0" y1={y} x2="400" y2={y} stroke="var(--contour-soft)" strokeWidth="0.6" />)}
        {/* road */}
        <path d="M-10 360 Q 120 320 180 250 Q 240 180 360 150 L 420 130" fill="none" stroke="#fff" strokeWidth="7" opacity="0.7" strokeLinecap="round" />
        <path d="M-10 360 Q 120 320 180 250 Q 240 180 360 150 L 420 130" fill="none" stroke="var(--sand-light)" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round" />
        {/* river */}
        <path d="M250 -10 Q 230 80 270 160 Q 300 240 250 330" fill="none" stroke="var(--terrain-water)" strokeWidth="5" opacity="0.85" strokeLinecap="round" />
        {/* user route */}
        {route && <path d={route} fill="none" stroke="var(--green-800)" strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round" opacity="0.85" />}
      </svg>
      {pins.map((p, i) => <MapPin key={i} {...p} compact={compact} />)}
      {children}
    </div>
  );
}
function MapPin({ x, y, n, score, cat, active, compact }) {
  const lv = score != null ? confOf(score) : 'hi';
  const col = CONF_VAR[lv];
  if (score != null) {
    return (
      <div style={{ position: 'absolute', left: x + '%', top: y + '%', transform: 'translate(-50%,-100%)', zIndex: active ? 6 : 3 }}>
        <div style={{ background: 'var(--card)', border: `1.5px solid ${col}`, borderRadius: 11, padding: compact ? '2px 7px' : '4px 9px',
          boxShadow: active ? 'var(--sh-lg)' : 'var(--sh)', display: 'flex', alignItems: 'center', gap: 5, transform: active ? 'scale(1.12)' : 'none', transition: 'transform .15s' }}>
          {cat && <Ic name={CATS[cat]?.icon} size={compact ? 12 : 13} color={col} stroke={2} />}
          <span className="display" style={{ fontWeight: 800, fontSize: compact ? 12 : 14, color: col, lineHeight: 1 }}>{score}</span>
        </div>
        <div style={{ width: 2, height: 9, background: col, margin: '0 auto', opacity: 0.7 }} />
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', left: x + '%', top: y + '%', transform: 'translate(-50%,-100%)', zIndex: active ? 6 : 3 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50% 50% 50% 3px', background: 'var(--green-800)', transform: 'rotate(45deg)',
        border: '2px solid #fff', boxShadow: 'var(--sh)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ transform: 'rotate(-45deg)', color: '#fff', fontWeight: 700, fontSize: 12, fontFamily: 'var(--f-display)' }}>{n}</span>
      </div>
    </div>
  );
}

/* ---------------- Map control cluster ---------------- */
function MapControls() {
  return (
    <div className="col g6" style={{ position: 'absolute', right: 14, top: 14, zIndex: 5 }}>
      {['plus', 'x'].map((k, i) => (
        <button key={i} style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--card)', border: '1px solid var(--line-2)',
          boxShadow: 'var(--sh-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)' }}>
          <Ic name={i === 0 ? 'plus' : 'arrow'} size={16} stroke={2} style={i === 1 ? { transform: 'rotate(45deg)' } : null} />
        </button>
      ))}
    </div>
  );
}

/* ---------------- Top navigation (desktop) ---------------- */
function TopBar({ active, go, trip }) {
  const tabs = [['home', 'Trips'], ['stop', 'Discover']];
  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(250,248,243,0.88)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ cursor: 'pointer' }} onClick={() => go('home')}><Logo size={24} /></div>
        <nav className="row g4" style={{ marginLeft: 8 }}>
          {tabs.map(([k, l]) => {
            const on = (k === 'home' && ['home', 'trip'].includes(active)) || (k === 'stop' && ['stop', 'place', 'search'].includes(active)) || k === active;
            return (
              <button key={k} onClick={() => go(k)} style={{ appearance: 'none', border: 'none', background: on ? 'var(--green-tint)' : 'transparent',
                color: on ? 'var(--green-800)' : 'var(--ink-2)', fontFamily: 'var(--f-body)', fontSize: 14, fontWeight: on ? 600 : 500,
                padding: '9px 15px', borderRadius: 9, cursor: 'pointer', transition: 'background .14s' }}>{l}</button>
            );
          })}
        </nav>
        <div className="grow" />
        <button onClick={() => go('stop')} style={{ display: 'flex', alignItems: 'center', gap: 9, height: 40, padding: '0 14px', minWidth: 220,
          background: 'var(--card)', border: '1px solid var(--line-2)', borderRadius: 10, color: 'var(--muted)', cursor: 'pointer', fontSize: 13.5 }}>
          <Ic name="search" size={17} color="var(--muted)" /> Search any place…
          <span className="grow" /><span className="mono" style={{ fontSize: 11, color: 'var(--muted)', border: '1px solid var(--line-2)', borderRadius: 5, padding: '1px 5px' }}>⌘K</span>
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>M</div>
      </div>
    </header>
  );
}

/* ---------------- Page container ---------------- */
function Page({ children, max = 1280, pad = 28 }) {
  return <div className="screen-anim" style={{ maxWidth: max, margin: '0 auto', padding: `28px ${pad}px 80px`, width: '100%' }}>{children}</div>;
}

/* ---------------- Breadcrumb ---------------- */
function Crumb({ items }) {
  return (
    <div className="row g8" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, flexWrap: 'wrap' }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Ic name="chevron" size={13} color="var(--line-2)" />}
          <span onClick={it.go} style={{ cursor: it.go ? 'pointer' : 'default', color: i === items.length - 1 ? 'var(--ink)' : 'var(--ink-2)', fontWeight: i === items.length - 1 ? 600 : 500 }}>{it.label}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------------- Shared data ---------------- */
const EVIDENCE_DSB = [
  { source: 'Official Website', kind: 'strong signal', claim: 'States "leashed dogs welcome on our patio year-round."', level: 'hi', icon: 'globe', weight: 94 },
  { source: 'OpenStreetMap', kind: 'supporting', claim: 'Tagged dog=yes for the outdoor seating area.', level: 'med', icon: 'pin', weight: 68 },
  { source: 'Review Evidence', kind: 'supporting', claim: '7 of the last 40 reviews mention bringing a dog; all positive.', level: 'med', icon: 'star', weight: 72 },
  { source: 'Pet Policy Doc', kind: 'no signal', claim: 'No formal indoor pet policy was found.', level: 'slate', icon: 'doc', weight: 24 },
];

const PLACES = [
  { id: 'dsb', name: 'Dark Sky Brewing', cat: 'brewery', score: 92, dist: 0.8, addr: '117 W Aspen Ave', blurb: 'Independent brewery with a large, shaded dog-friendly patio and rotating food trucks.', tags: ['Outdoor seating', 'Water bowls', 'Food trucks'], tone: 'green', summary: 'Official policy + outdoor seating' },
  { id: 'buffalo', name: 'Buffalo Park', cat: 'park', score: 88, dist: 1.4, addr: '2400 N Gemini Rd', blurb: 'Open 215-acre park with a flat 2-mile loop and big mountain views. Leashed dogs welcome.', tags: ['Leashed dogs', '2 mi loop', 'Open daily'], tone: 'green', summary: 'Leashed dogs allowed · open loop' },
  { id: 'fatmans', name: 'Fatmans Loop Trail', cat: 'trail', score: 84, dist: 3.1, addr: 'Mount Elden Trailhead', blurb: 'Rocky 2.4-mile loop through pine and oak with afternoon shade. Dogs welcome on leash.', tags: ['Dogs welcome', 'Shaded', '2.4 mi'], tone: 'cool', summary: 'Dogs welcome · shaded route' },
  { id: 'aspen', name: 'Aspen Corner Campground', cat: 'campground', score: 74, dist: 12, addr: 'Snowbowl Rd', blurb: 'High-elevation dispersed camping among the aspens. Dogs on leash; limited shade midday.', tags: ['Dogs on leash', 'Dispersed', 'Limited shade'], tone: 'sand', summary: 'Dogs on leash · limited shade' },
  { id: 'tourist', name: 'Tourist Home Café', cat: 'restaurant', score: 61, dist: 0.5, addr: '52 S San Francisco St', blurb: 'All-day café in a converted 1920s home. Dogs allowed on the front patio only.', tags: ['Patio only', 'All-day', 'Breakfast'], tone: 'sand', summary: 'Patio only · mixed mentions' },
  { id: 'little', name: 'Little America Hotel', cat: 'hotel', score: 48, dist: 2.2, addr: '2515 E Butler Ave', blurb: '500 wooded acres with pet walking areas. Pet fee applies; policy details unverified.', tags: ['Pet fee', 'Walking area', 'Unverified'], tone: 'green', summary: 'Fee applies · unverified policy' },
];

const STOPS = [
  { id: 'flagstaff', name: 'Flagstaff', state: 'AZ', n: 1, color: 'var(--green-800)', saved: ['dsb', 'buffalo', 'aspen'], x: 33, y: 64 },
  { id: 'sedona', name: 'Sedona', state: 'AZ', n: 2, color: 'var(--orange)', saved: ['fatmans', 'little', 'tourist'], x: 50, y: 47 },
  { id: 'moab', name: 'Moab', state: 'UT', n: 3, color: '#b08a4f', saved: ['fatmans', 'aspen'], x: 72, y: 24 },
];

const TRIPS = [
  { id: 'sedona', name: 'Sedona Fall Road Trip', stops: 3, places: 11, updated: '2 days ago', tone: 'sand', active: true },
  { id: 'colorado', name: 'Colorado Mountains Weekend', stops: 5, places: 18, updated: 'last week', tone: 'green' },
  { id: 'pnw', name: 'Pacific Northwest Adventure', stops: 2, places: 6, updated: 'Apr 12', tone: 'cool' },
  { id: 'moab', name: 'Moab Desert Loop', stops: 4, places: 14, updated: 'Mar 30', tone: 'sand' },
];

function placeById(id) { return PLACES.find(p => p.id === id); }

/* ---- cross-page navigation: every screen is a standalone pixel-final page ---- */
const PAGES = {
  home: 'Trips.html',
  trip: 'Trip Detail.html',
  stop: 'Stop Detail.html',
  place: 'Place Detail.html',
  search: 'Stop Detail.html', // discovery surface until a dedicated Search screen exists
};
function navTo(screen, params = {}) {
  try {
    localStorage.setItem('bb_route', JSON.stringify({ screen, params }));
    localStorage.setItem('bb_device', 'desktop');
  } catch (e) {}
  window.location.href = PAGES[screen] || 'Trips.html';
}

Object.assign(window, {
  React, useState, useEffect, useRef, Ic, Logo, CATS, FILTERS, Conf, confOf, CONF_VAR, CONF_LABEL,
  ScoreRing, ScoreBadge, Photo, TerrainMap, MapPin, MapControls, TopBar, Page, Crumb,
  EVIDENCE_DSB, PLACES, STOPS, TRIPS, placeById, PAGES, navTo,
});
