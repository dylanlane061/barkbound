// ============================================================
//  TRIP DETAIL — pixel-final (focused, editable itinerary)
//  No map: the screen is the route timeline. Discover, add
//  stops, reorder stops, and curate saved places inline.
// ============================================================

const TRIP = { id: 'sedona', name: 'Sedona Fall Road Trip', active: true, updated: '2 days ago', dates: 'Oct 12 – 18' };

/* uid = stable identity across reorder · town = id used for drive-leg lookup */
const INITIAL_STOPS = [
  { uid: 's1', town: 'flagstaff', name: 'Flagstaff', state: 'Arizona', color: 'var(--green-800)', nights: 2, dates: 'Oct 12 – 14', note: 'Basecamp in the pines', saved: ['dsb', 'buffalo', 'aspen'] },
  { uid: 's2', town: 'sedona', name: 'Sedona', state: 'Arizona', color: 'var(--orange)', nights: 2, dates: 'Oct 14 – 16', note: 'Red rock country', saved: ['tourist', 'fatmans', 'little'] },
  { uid: 's3', town: 'moab', name: 'Moab', state: 'Utah', color: '#b08a4f', nights: 2, dates: 'Oct 16 – 18', note: 'Desert arches & rivers', saved: ['buffalo', 'fatmans'] },
];

/* pairwise drive legs (keys are town ids, alphabetically sorted) */
const LEGS = {
  'flagstaff|sedona': { mi: 30, time: '45 min' },
  'flagstaff|moab': { mi: 300, time: '4h 50m' },
  'moab|sedona': { mi: 280, time: '4h 30m' },
  'cottonwood|flagstaff': { mi: 45, time: '55 min' },
  'cottonwood|sedona': { mi: 20, time: '30 min' },
  'flagstaff|williams': { mi: 33, time: '40 min' },
  'flagstaff|page': { mi: 135, time: '2h 20m' },
  'page|sedona': { mi: 110, time: '2h 5m' },
  'moab|page': { mi: 160, time: '2h 40m' },
  'kanab|moab': { mi: 250, time: '4h' },
};
function legBetween(a, b) { if (!a || !b) return null; return LEGS[[a, b].sort().join('|')] || null; }

const SUGGESTED = [
  { town: 'williams', name: 'Williams', state: 'Arizona' },
  { town: 'page', name: 'Page', state: 'Arizona' },
  { town: 'cottonwood', name: 'Cottonwood', state: 'Arizona' },
  { town: 'kanab', name: 'Kanab', state: 'Utah' },
];
const NEW_COLORS = ['var(--green-700)', '#7a8a5c', 'var(--green-600)', '#b08a4f', 'var(--orange)'];

/* saved ids → place objects, ranked high→low by PawSignal score */
function savedPlaces(stop) {
  return stop.saved.map(placeById).filter(Boolean).sort((a, b) => b.score - a.score);
}

/* ---- one saved place inside a stop ---- */
function SavedRow({ place, top, onRemove, go }) {
  const col = CONF_VAR[confOf(place.score)];
  return (
    <div className="stop-pick sp-row row g12 center" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 9, background: 'var(--card)' }}
      onClick={() => go('place', { place: place.id })}>
      <Photo h={48} w={48} cat={place.cat} tone={place.tone} round={10} style={{ flexShrink: 0 }} />
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row g8 center">
          <span className="display" style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--green-900)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</span>
          {top && <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#fff', background: 'var(--orange)', padding: '2px 6px', borderRadius: 999 }}>Top pick</span>}
        </div>
        <div className="row g6 center" style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 3 }}>
          <Ic name={CATS[place.cat].icon} size={12} color="var(--green-700)" style={{ flexShrink: 0 }} />
          <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{CATS[place.cat].label} · {place.dist} mi</span>
          <span style={{ color: 'var(--line-2)' }}>·</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.summary}</span>
        </div>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--card)', border: `1.5px solid ${col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="display" style={{ fontWeight: 800, fontSize: 15, color: col, lineHeight: 1 }}>{place.score}</span>
      </div>
      <button className="sp-x rc-btn" title="Remove from stop" onClick={(e) => { e.stopPropagation(); onRemove(place.id); }} style={{ flexShrink: 0 }}>
        <Ic name="x" size={15} color="var(--muted)" />
      </button>
    </div>
  );
}

/* ---- leg connector between two stops ---- */
function Leg({ leg, name }) {
  return (
    <div className="row g8 center" style={{ margin: '2px 0 14px', color: 'var(--muted)' }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--paper-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic name="route" size={13} color="var(--green-700)" />
      </span>
      {leg
        ? <React.Fragment><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>{leg.mi} mi</span><span style={{ color: 'var(--line-2)' }}>·</span><span style={{ fontSize: 12 }}>~{leg.time} drive to {name}</span></React.Fragment>
        : <span style={{ fontSize: 12 }}>Drive to {name} · <span style={{ color: 'var(--green-700)', fontWeight: 600 }}>add drive details</span></span>}
    </div>
  );
}

/* small square control button */
function CtrlBtn({ icon, rotate, disabled, onClick, title }) {
  return (
    <button title={title} disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
      style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--card)', border: '1px solid var(--line-2)', cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1, transition: 'border-color .14s, background .14s' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--green-600)'; e.currentTarget.style.background = 'var(--green-tint-2)'; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.background = 'var(--card)'; }}>
      <Ic name={icon} size={16} color="var(--ink-2)" stroke={2} style={rotate ? { transform: `rotate(${rotate}deg)` } : null} />
    </button>
  );
}

/* ---- a stop: spine pin + dashed line + editable card ---- */
function StopSection({ stop, n, index, total, onMoveUp, onMoveDown, onRemovePlace, onRemoveStop, go }) {
  const places = savedPlaces(stop);
  const last = index === total - 1;
  return (
    <div className="row" style={{ alignItems: 'stretch', gap: 16 }}>
      {/* spine */}
      <div style={{ position: 'relative', width: 34, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        {!last && <div style={{ position: 'absolute', top: 30, bottom: -22, left: '50%', width: 0, borderLeft: '2px dashed var(--line-2)' }} />}
        <div style={{ position: 'relative', zIndex: 1, width: 30, height: 30, borderRadius: '50% 50% 50% 4px', background: stop.color, transform: 'rotate(45deg)',
          border: '2px solid var(--paper)', boxShadow: 'var(--sh-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="display" style={{ transform: 'rotate(-45deg)', color: '#fff', fontWeight: 800, fontSize: 13 }}>{n}</span>
        </div>
      </div>

      {/* card */}
      <div className="grow" style={{ minWidth: 0, paddingBottom: last ? 0 : 26 }}>
        <div className="stop-card card" style={{ position: 'relative', padding: 16 }}>
          {onRemoveStop && (
            <button className="stop-x rc-btn" title="Remove stop" onClick={() => onRemoveStop(stop.uid)}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
              <Ic name="x" size={15} color="var(--muted)" />
            </button>
          )}
          {/* header */}
          <div className="row between" style={{ alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="row g10 center">
                <h2 className="display" style={{ fontWeight: 800, fontSize: 21, color: 'var(--green-900)', margin: 0 }}>{stop.name}</h2>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>{stop.state}</span>
              </div>
              <div className="row g10 center wrap" style={{ marginTop: 6, fontSize: 12.5, color: 'var(--ink-2)' }}>
                <span className="row g6 center"><Ic name="clock" size={13} color="var(--green-700)" />{stop.nights} {stop.nights === 1 ? 'night' : 'nights'}{stop.dates ? ` · ${stop.dates}` : ''}</span>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span className="row g6 center"><Ic name="bookmark" size={13} color="var(--green-700)" />{places.length} saved</span>
              </div>
            </div>
            <div className="row" style={{ gap: 6, flexShrink: 0, marginRight: onRemoveStop ? 30 : 0 }}>
              <CtrlBtn icon="chevronD" rotate={180} disabled={index === 0} onClick={onMoveUp} title="Move stop earlier" />
              <CtrlBtn icon="chevronD" disabled={last} onClick={onMoveDown} title="Move stop later" />
            </div>
          </div>

          {stop.note && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: -6, marginBottom: 13 }}>{stop.note}</div>}

          {/* saved places */}
          {places.length > 0 ? (
            <div className="col g8">
              {places.map((p, i) => <SavedRow key={p.id} place={p} top={i === 0} onRemove={(id) => onRemovePlace(stop.uid, id)} go={go} />)}
            </div>
          ) : (
            <div style={{ padding: '16px 14px', borderRadius: 12, border: '1.5px dashed var(--line-2)', background: 'var(--paper)', textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>No places saved here yet.<br />Discover dog-friendly spots nearby.</div>
            </div>
          )}

          {/* discover cta */}
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: 12 }}
            onClick={() => go('stop', { stop: stop.town })}>
            <Ic name="search" size={15} color="var(--green-800)" />Discover more places near {stop.name}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- inline add-stop picker ---- */
function AddStopPanel({ existingTowns, onAdd }) {
  const [open, setOpen] = useState(false);
  const avail = SUGGESTED.filter(s => !existingTowns.includes(s.town));
  return (
    <div className="row" style={{ gap: 16, marginTop: 4 }}>
      <div style={{ width: 34, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <span style={{ width: 30, height: 30, borderRadius: '50%', border: '2px dashed var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic name="plus" size={15} color="var(--muted)" stroke={2} />
        </span>
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        {!open ? (
          <button className="btn btn-quiet" style={{ width: '100%', justifyContent: 'flex-start', border: '1.5px dashed var(--line-2)', borderRadius: 14, padding: '16px 18px', color: 'var(--green-800)', fontWeight: 600 }}
            onClick={() => setOpen(true)}>
            <Ic name="plus" size={17} color="var(--green-800)" stroke={2} />Add another stop to this trip
          </button>
        ) : (
          <div className="card pop" style={{ padding: 16 }}>
            <div className="row between center" style={{ marginBottom: 13 }}>
              <span className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-900)' }}>Add a stop</span>
              <button className="rc-btn" onClick={() => setOpen(false)} title="Cancel"><Ic name="x" size={15} color="var(--muted)" /></button>
            </div>
            <div className="input-wrap" style={{ marginBottom: 14 }}>
              <span className="input-ic"><Ic name="search" size={17} color="var(--muted)" /></span>
              <input className="input" placeholder="Search for a town or city…" />
            </div>
            <div className="label" style={{ marginBottom: 10 }}>Suggested along your route</div>
            {avail.length > 0 ? (
              <div className="row wrap g8">
                {avail.map(s => (
                  <button key={s.town} className="chip" onClick={() => { onAdd(s); setOpen(false); }}>
                    <Ic name="pin" size={14} color="var(--green-700)" />{s.name}, {s.state}
                    <Ic name="plus" size={13} color="var(--green-700)" stroke={2} style={{ marginLeft: 2 }} />
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>You've added all the suggested towns. Search above to add any other place.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- hero ---- */
function TripHero({ stats, go }) {
  const items = [
    ['pin', `${stats.stops} stops`],
    ['bookmark', `${stats.places} places saved`],
    ['route', `${stats.miles} miles`],
    ['clock', `${stats.nights} nights · ${TRIP.dates}`],
  ];
  return (
    <div style={{ borderBottom: '1px solid var(--line)', background: 'linear-gradient(180deg, var(--green-tint-2), var(--paper))' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 28px 22px' }}>
        <Crumb items={[{ label: 'Trips', go: () => go('home') }, { label: TRIP.name }]} />
        <div className="row between" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ maxWidth: 560 }}>
            {TRIP.active && (
              <div className="row g8 center" style={{ marginBottom: 10 }}>
                <span className="row g6 center" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff', background: 'var(--orange)', padding: '4px 10px', borderRadius: 999 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />Active trip
                </span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updated {TRIP.updated}</span>
              </div>
            )}
            <h1 className="display" style={{ fontWeight: 800, fontSize: 33, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}>{TRIP.name}</h1>
            <div className="row g16 wrap" style={{ marginTop: 13, color: 'var(--ink-2)', fontSize: 13.5 }}>
              {items.map(([ic, txt], i) => <span key={i} className="row g6 center"><Ic name={ic} size={16} color="var(--green-700)" />{txt}</span>)}
            </div>
          </div>
          <div className="row g10" style={{ flexShrink: 0 }}>
            <button className="btn btn-ghost"><Ic name="share" size={16} color="var(--green-800)" />Share</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- loading skeleton (single column) ---- */
function SkeletonTrip() {
  return (
    <div>
      <div style={{ borderBottom: '1px solid var(--line)', background: 'var(--green-tint-2)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 26px' }}>
          <div className="sk" style={{ width: 200, height: 12, marginBottom: 16 }} />
          <div className="sk" style={{ width: 360, height: 30, marginBottom: 12 }} />
          <div className="sk" style={{ width: 420, height: 13 }} />
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 28px 60px' }} className="col g20">
        {[0, 1, 2].map(i => (
          <div key={i} className="row g16" style={{ alignItems: 'flex-start' }}>
            <div className="sk" style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0 }} />
            <div className="card grow" style={{ padding: 16 }}>
              <div className="sk" style={{ width: 160, height: 20, marginBottom: 10 }} />
              <div className="sk" style={{ width: 240, height: 12, marginBottom: 16 }} />
              <div className="col g8">{[0, 1, 2].map(j => <div key={j} className="sk" style={{ width: '100%', height: 66, borderRadius: 12 }} />)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { TRIP, INITIAL_STOPS, LEGS, legBetween, SUGGESTED, NEW_COLORS, savedPlaces, SavedRow, Leg, CtrlBtn, StopSection, AddStopPanel, TripHero, SkeletonTrip });
