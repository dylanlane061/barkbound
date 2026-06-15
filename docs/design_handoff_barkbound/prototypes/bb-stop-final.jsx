// ============================================================
//  STOP / DISCOVERY — pixel-final (desktop, linked list ⇄ map)
// ============================================================

/* ---- enriched discovery data (Flagstaff & 25 mi) ----
   `init` is the on-arrival state: 'scored' places were assessed previously,
   'unscored' places have never had PawSignal run — the user requests those. */
const DISCO = [
  { id: 'dsb',     x: 31, y: 36, init: 'scored',   best: 'Top match',  why: 'Official patio policy + water bowls', sources: 4, open: 'Open until 10pm' },
  { id: 'buffalo', x: 60, y: 28, init: 'scored',   best: 'Most space', why: '215 open acres, easy 2-mile loop',     sources: 3, open: 'Open daily' },
  { id: 'tourist', x: 23, y: 63, init: 'scored',   best: null,         why: 'Front patio only, all-day café',       sources: 3, open: 'Open until 3pm' },
  { id: 'fatmans', x: 45, y: 60, init: 'unscored', best: null,         why: 'Shaded pine loop, dogs on leash',      sources: 3, open: 'Trail · dawn–dusk' },
  { id: 'aspen',   x: 73, y: 51, init: 'unscored', best: null,         why: 'Dispersed camping among the aspens',   sources: 2, open: 'Seasonal' },
  { id: 'little',  x: 67, y: 73, init: 'unscored', best: null,         why: 'Pet fee applies, policy unverified',   sources: 2, open: 'Front desk 24h' },
].map(d => ({ ...placeById(d.id), ...d }));

/* ---- tiny spinner ---- */
function Spinner({ size = 16, color }) {
  return <span className="bb-spin" style={{ width: size, height: size, borderTopColor: color || 'var(--green-700)' }} />;
}

/* ---- status-aware ring: score / dashed-paw / spinning progress ---- */
function StatusRing({ status, score, done = 0, total = 1, size = 54 }) {
  const stroke = 5, r = (size - stroke) / 2 - 3, c = size / 2, circ = 2 * Math.PI * r;
  if (status === 'scored') return <ScoreRing value={score} size={size} stroke={stroke} label={null} />;
  if (status === 'computing') {
    return (
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-2)" strokeWidth={stroke} />
          <circle className="ring-spin" cx={c} cy={c} r={r} fill="none" stroke="var(--green-700)" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={`${circ * 0.26} ${circ}`} style={{ transformOrigin: '50% 50%' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: size * 0.26, color: 'var(--green-800)' }}>{done}/{total}</div>
      </div>
    );
  }
  // unscored / queued — dashed paw ring
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line-2)" strokeWidth={stroke} strokeDasharray="2.5 6" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ic name="paw" size={size * 0.38} color="var(--muted)" fill="var(--muted)" stroke={0} />
      </div>
    </div>
  );
}

/* ---- custom map pin (status + hover/select control) ---- */
function MapPinX({ p, status, done, st, onEnter, onLeave, onClick }) {
  const scored = status === 'scored';
  const lv = confOf(p.score), col = scored ? CONF_VAR[lv] : 'var(--muted)';
  const active = st === 'hover' || st === 'sel';
  const computing = status === 'computing';
  return (
    <div style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-100%)', zIndex: st === 'sel' ? 9 : active || computing ? 7 : 3 }}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <div className="pin-pop" style={{ opacity: active ? 1 : 0, transform: active ? 'translate(-50%,0)' : 'translate(-50%,4px)' }}>
        {p.name}
      </div>
      <div className={computing ? 'pin-pulse' : ''} style={{
        background: st === 'sel' && scored ? col : 'var(--card)', border: `1.5px solid ${scored ? col : 'var(--line-2)'}`,
        borderStyle: scored || computing ? 'solid' : 'dashed', borderRadius: 11,
        padding: '4px 9px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
        boxShadow: active ? 'var(--sh-lg)' : 'var(--sh)',
        transform: active ? 'scale(1.14)' : 'none', transition: 'transform .16s, box-shadow .16s, background .16s' }}>
        {scored ? (
          <React.Fragment>
            <Ic name={CATS[p.cat]?.icon} size={13} color={st === 'sel' ? '#fff' : col} stroke={2} />
            <span className="display" style={{ fontWeight: 800, fontSize: 14, color: st === 'sel' ? '#fff' : col, lineHeight: 1 }}>{p.score}</span>
          </React.Fragment>
        ) : computing ? (
          <Spinner size={13} />
        ) : (
          <Ic name="paw" size={14} color="var(--muted)" fill="var(--muted)" stroke={0} />
        )}
      </div>
      <div style={{ width: 2, height: 9, background: scored ? col : 'var(--line-2)', margin: '0 auto', opacity: 0.75 }} />
    </div>
  );
}

/* ---- confidence legend ---- */
function MapLegend() {
  const items = [['hi', 'High'], ['med', 'Medium'], ['lo', 'Lower']];
  return (
    <div style={{ position: 'absolute', left: 14, bottom: 14, background: 'var(--card)', borderRadius: 11, padding: '9px 12px', boxShadow: 'var(--sh)', display: 'flex', gap: 14, zIndex: 5 }}>
      <span className="label" style={{ fontSize: 9.5 }}>Confidence</span>
      {items.map(([k, l]) => (
        <span key={k} className="row g6 center" style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CONF_VAR[k] }} />{l}
        </span>
      ))}
    </div>
  );
}

/* ---- floating peek card (selected place) ---- */
function PeekCard({ p, status, done, saved, onSave, onRun, onClose, go }) {
  const lv = confOf(p.score);
  const scored = status === 'scored';
  const computing = status === 'computing';
  return (
    <div className="peek-card card" style={{ position: 'absolute', left: 14, right: 14, bottom: 14, zIndex: 8, padding: 13, display: 'flex', gap: 13, alignItems: 'center', boxShadow: 'var(--sh-lg)' }}>
      <Photo h={70} w={70} cat={p.cat} tone={p.tone} round={11} style={{ flexShrink: 0 }} />
      <div className="grow">
        <div className="row g8 center" style={{ marginBottom: 3 }}>
          <span className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-900)' }}>{p.name}</span>
          {scored ? <Conf level={lv} small /> : <span className="conf conf-slate" style={{ fontSize: 10, padding: '3px 7px 3px 6px' }}>{computing ? 'Checking' : 'No score'}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>{CATS[p.cat].label} · {p.dist} mi · {p.open}</div>
        <div className="row g6 center" style={{ fontSize: 12, color: 'var(--ink-2)' }}>
          {scored
            ? <React.Fragment><Ic name="check" size={12} color="var(--hi)" stroke={2.4} />{p.why}</React.Fragment>
            : computing
              ? <React.Fragment><Spinner size={12} />Checking {done}/{p.sources} sources…</React.Fragment>
              : <React.Fragment><Ic name="shield" size={12} color="var(--muted)" />Not checked yet · {p.sources} sources to scan</React.Fragment>}
        </div>
      </div>
      <StatusRing status={status} score={p.score} done={done} total={p.sources} size={56} />
      <div className="col g8" style={{ flexShrink: 0 }}>
        {scored ? (
          <React.Fragment>
            <button className="btn btn-orange btn-sm" onClick={() => go('place', { place: p.id })}>Details<Ic name="arrow" size={14} color="#fff" /></button>
            <button className="btn btn-ghost btn-sm" onClick={onSave} style={saved ? { color: 'var(--hi)', borderColor: 'var(--hi-line)', background: 'var(--hi-bg)' } : null}>
              <Ic name={saved ? 'check' : 'bookmark'} size={14} color={saved ? 'var(--hi)' : 'var(--green-800)'} stroke={saved ? 2.4 : 1.7} />{saved ? 'Saved' : 'Save'}
            </button>
          </React.Fragment>
        ) : (
          <button className="btn btn-orange btn-sm" onClick={onRun} disabled={computing} style={computing ? { background: 'var(--green-tint)', color: 'var(--green-800)' } : null}>
            {computing ? <React.Fragment><Spinner size={13} />Checking…</React.Fragment> : <React.Fragment><Ic name="paw" size={14} color="#fff" fill="#fff" stroke={0} />Run check</React.Fragment>}
          </button>
        )}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: 'absolute', top: 9, right: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted)' }}>
        <Ic name="x" size={15} color="var(--muted)" />
      </button>
    </div>
  );
}

/* ---- radius control with slider popover ---- */
function RadiusControl({ radius, setRadius }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="chip on" onClick={() => setOpen(o => !o)}>
        <Ic name="sliders" size={15} color="#fff" />{radius} mi radius
        <Ic name="chevronD" size={13} color="rgba(255,255,255,0.75)" style={{ marginLeft: 1 }} />
      </button>
      {open && (
        <div className="pop" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 60, width: 256, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--sh-lg)', padding: 16 }}>
          <div className="row between center" style={{ marginBottom: 12 }}>
            <span className="label">Search radius</span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-800)' }}>{radius} mi</span>
          </div>
          <input type="range" min="2" max="50" step="1" value={radius} onChange={(e) => setRadius(+e.target.value)} className="bb-range" style={{ width: '100%' }} />
          <div className="row between" style={{ marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>2 mi</span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--muted)' }}>50 mi</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- sticky filter bar ---- */
function FilterBarX({ cats, toggle, radius, setRadius, reset, count }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(250,248,243,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)' }}>
      <div className="row g10 wrap" style={{ maxWidth: 1320, margin: '0 auto', padding: '13px 28px' }}>
        <RadiusControl radius={radius} setRadius={setRadius} />
        <div style={{ width: 1, height: 24, background: 'var(--line-2)', margin: '0 2px', alignSelf: 'center' }} />
        {FILTERS.map(([k, l]) => (
          <button key={k} className={`chip ${cats[k] ? 'on' : ''}`} onClick={() => toggle(k)}>
            <Ic name={CATS[k].icon} size={14} color={cats[k] ? '#fff' : 'var(--ink-2)'} />{l}
          </button>
        ))}
        <div className="grow" />
        <button className="chip" onClick={reset} style={{ borderStyle: 'dashed' }}><Ic name="x" size={13} color="var(--muted)" />Reset</button>
      </div>
    </div>
  );
}

/* ---- enriched result card (status-aware) ---- */
function ResultCardX({ p, rank, idx, status, done, selected, saved, onHover, onSelect, onSave, onRun, go }) {
  const lv = confOf(p.score);
  const scored = status === 'scored';
  const computing = status === 'computing';
  return (
    <div className="res-card card" data-id={p.id} style={{ animationDelay: Math.min(idx * 35, 280) + 'ms',
      padding: 14, display: 'flex', gap: 14, cursor: 'pointer',
      borderColor: selected ? 'var(--green-600)' : 'var(--line)',
      boxShadow: selected ? 'var(--sh)' : 'var(--sh-sm)',
      background: selected ? 'var(--green-tint-2)' : 'var(--card)',
      transition: 'border-color .16s, box-shadow .16s, background .16s, transform .16s' }}
      onMouseEnter={() => onHover(p.id)} onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(p.id)}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Photo h={94} w={94} cat={p.cat} tone={p.tone} round={12} style={scored ? null : { filter: 'saturate(0.7)', opacity: 0.92 }} />
        {scored ? (
          <span style={{ position: 'absolute', top: 7, left: 7, width: 22, height: 22, borderRadius: 7, background: 'rgba(20,53,42,0.82)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontWeight: 800, fontSize: 11.5 }}>{rank}</span>
        ) : (
          <span style={{ position: 'absolute', top: 7, left: 7, padding: '2px 7px', borderRadius: 7, background: computing ? 'var(--green-700)' : 'rgba(28,28,28,0.55)', color: '#fff',
            fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{computing ? 'Checking' : 'New'}</span>
        )}
        {scored && p.best && (
          <span style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap',
            background: 'var(--orange)', color: '#fff', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 999, boxShadow: 'var(--sh-sm)' }}>{p.best}</span>
        )}
      </div>
      <div className="grow">
        <div className="row between" style={{ alignItems: 'flex-start', gap: 10 }}>
          <div className="grow">
            <div className="row g8 center">
              <Ic name={CATS[p.cat].icon} size={15} color="var(--green-700)" />
              <span className="display" style={{ fontWeight: 700, fontSize: 16.5, color: 'var(--green-900)' }}>{p.name}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{CATS[p.cat].label} · {p.dist} mi · {p.open}</div>
          </div>
          <StatusRing status={status} score={p.score} done={done} total={p.sources} size={54} />
        </div>

        {scored ? (
          <React.Fragment>
            <div className="row g6 center" style={{ marginTop: 9, fontSize: 12.5, color: 'var(--ink-2)' }}>
              <Ic name="check" size={13} color={lv === 'hi' ? 'var(--hi)' : 'var(--muted)'} stroke={2.4} />{p.why}
            </div>
            <div className="row between center" style={{ marginTop: 11 }}>
              <span className="row g6 center" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                <Ic name="shield" size={13} color="var(--muted)" />{p.sources} sources checked
              </span>
              <div className="row g6 center">
                <button className="rc-btn" onClick={(e) => { e.stopPropagation(); onSave(p.id); }} title="Save to stop"
                  style={saved ? { color: 'var(--hi)', borderColor: 'var(--hi-line)', background: 'var(--hi-bg)' } : null}>
                  <Ic name={saved ? 'check' : 'bookmark'} size={14} color={saved ? 'var(--hi)' : 'var(--green-800)'} stroke={saved ? 2.4 : 1.7} />
                </button>
                <button className="rc-btn rc-arrow" onClick={(e) => { e.stopPropagation(); go('place', { place: p.id }); }} title="View details">
                  <Ic name="arrow" size={15} color="var(--green-800)" />
                </button>
              </div>
            </div>
          </React.Fragment>
        ) : computing ? (
          <div style={{ marginTop: 11 }}>
            <div className="row between center" style={{ fontSize: 11.5, color: 'var(--green-700)', fontWeight: 600, marginBottom: 7 }}>
              <span className="row g6 center"><Spinner size={12} />Checking sources…</span>
              <span className="mono" style={{ color: 'var(--muted)', fontWeight: 500 }}>{done} / {p.sources}</span>
            </div>
            <div style={{ height: 5, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: (done / p.sources * 100) + '%', height: '100%', background: 'var(--green-700)', borderRadius: 3, transition: 'width .5s cubic-bezier(0.22,1,0.36,1)' }} />
            </div>
          </div>
        ) : (
          <div className="row between center" style={{ marginTop: 11, gap: 10 }}>
            <span className="row g6 center" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
              <Ic name="shield" size={13} color="var(--muted)" />Not checked · {p.sources} sources
            </span>
            <button className="btn btn-orange btn-sm" onClick={(e) => { e.stopPropagation(); onRun(p.id); }}>
              <Ic name="paw" size={13} color="#fff" fill="#fff" stroke={0} />Run check
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- empty state (filters exclude everything) ---- */
function EmptyState({ reset }) {
  return (
    <div className="card" style={{ padding: '46px 28px', textAlign: 'center', borderStyle: 'dashed', background: 'var(--paper)' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Ic name="search" size={26} color="var(--muted)" />
      </div>
      <div className="display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--green-900)', marginBottom: 6 }}>No places match those filters</div>
      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 auto 18px', maxWidth: 320, lineHeight: 1.5 }}>Try widening the radius or turning a category back on.</p>
      <button className="btn btn-ghost btn-sm" onClick={reset} style={{ margin: '0 auto' }}><Ic name="x" size={14} color="var(--green-800)" />Reset filters</button>
    </div>
  );
}

/* ---- discover search empty-state (the screen you land on from the Discover tab) ---- */
const SEARCH_TRIP_STOPS = [
  { id: 'flagstaff', name: 'Flagstaff', sub: 'Arizona · Sedona Fall Road Trip', n: 1, color: 'var(--green-800)' },
  { id: 'sedona', name: 'Sedona', sub: 'Arizona · Sedona Fall Road Trip', n: 2, color: 'var(--orange)' },
  { id: 'moab', name: 'Moab', sub: 'Utah · Sedona Fall Road Trip', n: 3, color: '#b08a4f' },
];
const SEARCH_POPULAR = [
  { id: 'flagstaff', name: 'Flagstaff, AZ', tone: 'green', glyph: 'trees' },
  { id: 'bend', name: 'Bend, OR', tone: 'cool', glyph: 'trees' },
  { id: 'asheville', name: 'Asheville, NC', tone: 'green', glyph: 'trail' },
  { id: 'moab', name: 'Moab, UT', tone: 'sand', glyph: 'camp' },
  { id: 'tahoe', name: 'Lake Tahoe, CA', tone: 'cool', glyph: 'trees' },
  { id: 'austin', name: 'Austin, TX', tone: 'rust', glyph: 'pin' },
];

function DiscoverSearch({ onPick, go }) {
  const [q, setQ] = useState('');
  const matches = q.trim()
    ? SEARCH_POPULAR.concat(SEARCH_TRIP_STOPS.map(s => ({ id: s.id, name: s.name + ', ' + s.sub.split(' · ')[0].slice(0, 2).toUpperCase(), raw: s.name })))
        .filter((v, i, a) => a.findIndex(x => x.name === v.name) === i)
        .filter(p => p.name.toLowerCase().includes(q.trim().toLowerCase()))
    : [];
  const submit = (name) => onPick((name || q).replace(/,.*$/, '').trim() || q.trim());

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* on-brand terrain backdrop */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <TerrainMap h="100%" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(250,248,243,0.62), rgba(250,248,243,0.93) 62%, var(--paper))' }} />
      </div>

      <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto', padding: '72px 28px 80px', textAlign: 'center' }}>
        <div className="row g6 center" style={{ justifyContent: 'center', marginBottom: 16 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--card)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)' }}>
            <Ic name="paw" size={16} color="var(--green-700)" fill="var(--green-700)" stroke={0} />
          </span>
          <span className="label">Powered by PawSignal</span>
        </div>
        <h1 className="display" style={{ fontWeight: 800, fontSize: 38, lineHeight: 1.08, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}>Find dog-friendly places<br />anywhere you&rsquo;re headed</h1>
        <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: '14px auto 0', maxWidth: 460, lineHeight: 1.5 }}>Search a town or city and we&rsquo;ll surface the parks, patios, trails and stays — each scored from real public evidence.</p>

        {/* search field */}
        <div style={{ position: 'relative', maxWidth: 540, margin: '30px auto 0', textAlign: 'left' }}>
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)' }}><Ic name="search" size={20} color="var(--green-700)" /></span>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a town or city…"
              style={{ width: '100%', height: 60, padding: '0 120px 0 50px', borderRadius: 16, border: '1px solid var(--line-2)', background: 'var(--card)',
                fontFamily: 'var(--f-body)', fontSize: 16.5, color: 'var(--ink)', boxShadow: 'var(--sh)', outline: 'none' }} />
            <button type="submit" className="btn btn-primary" style={{ position: 'absolute', right: 9, top: 9, height: 42 }}>
              Search<Ic name="arrow" size={16} color="#fff" />
            </button>
          </form>

          {/* live suggestions */}
          {matches.length > 0 && (
            <div className="card pop" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', zIndex: 5, padding: 6, boxShadow: 'var(--sh-pop)' }}>
              {matches.slice(0, 5).map(m => (
                <button key={m.id + m.name} onClick={() => submit(m.raw || m.name)} className="srch-opt row g10 center"
                  style={{ width: '100%', appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, textAlign: 'left' }}>
                  <Ic name="pin" size={16} color="var(--green-700)" />
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{m.name}</span>
                  <span className="grow" />
                  <Ic name="arrow" size={15} color="var(--line-2)" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* your trip stops */}
        <div style={{ maxWidth: 540, margin: '28px auto 0', textAlign: 'left' }}>
          <div className="label" style={{ marginBottom: 10 }}>Jump to a stop on your trip</div>
          <div className="col g8">
            {SEARCH_TRIP_STOPS.map(s => (
              <button key={s.id} onClick={() => onPick(s.name)} className="srch-card row g12 center"
                style={{ width: '100%', appearance: 'none', cursor: 'pointer', textAlign: 'left', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 13, padding: '11px 13px', boxShadow: 'var(--sh-sm)', transition: 'border-color .14s, box-shadow .14s' }}>
                <span style={{ width: 30, height: 30, borderRadius: '50% 50% 50% 4px', background: s.color, transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--sh-sm)' }}>
                  <span className="display" style={{ transform: 'rotate(-45deg)', color: '#fff', fontWeight: 800, fontSize: 13 }}>{s.n}</span>
                </span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="display" style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--green-900)' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{s.sub}</div>
                </div>
                <span className="row g5 center" style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--green-800)' }}>Discover<Ic name="arrow" size={15} color="var(--green-700)" /></span>
              </button>
            ))}
          </div>
        </div>

        {/* popular destinations */}
        <div style={{ maxWidth: 540, margin: '26px auto 0', textAlign: 'left' }}>
          <div className="label" style={{ marginBottom: 10 }}>Popular with dog parents</div>
          <div className="row wrap g8">
            {SEARCH_POPULAR.map(p => (
              <button key={p.id} onClick={() => onPick(p.name.replace(/,.*$/, ''))} className="chip">
                <Ic name="pin" size={14} color="var(--green-700)" />{p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- loading skeleton (split layout) ---- */
function SkeletonStop() {
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 1fr) 1fr', alignItems: 'start' }}>
        <div style={{ padding: '20px 28px 60px' }}>
          <div className="sk" style={{ width: 280, height: 12, marginBottom: 18 }} />
          <div className="sk" style={{ width: 220, height: 28, marginBottom: 10 }} />
          <div className="sk" style={{ width: 260, height: 12, marginBottom: 22 }} />
          <div className="col g14">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="card" style={{ padding: 14, display: 'flex', gap: 14 }}>
                <div className="sk" style={{ width: 94, height: 94, borderRadius: 12, flexShrink: 0 }} />
                <div className="grow">
                  <div className="sk" style={{ width: '55%', height: 16, marginBottom: 9 }} />
                  <div className="sk" style={{ width: '40%', height: 11, marginBottom: 14 }} />
                  <div className="sk" style={{ width: '85%', height: 11, marginBottom: 9 }} />
                  <div className="sk" style={{ width: '60%', height: 11 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'sticky', top: 56, height: 'calc(100vh - 56px)', minHeight: 520, padding: 0 }}>
          <div className="sk" style={{ height: '100%', borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DISCO, Spinner, StatusRing, MapPinX, MapLegend, PeekCard, RadiusControl, FilterBarX, ResultCardX, EmptyState, DiscoverSearch, SkeletonStop });
