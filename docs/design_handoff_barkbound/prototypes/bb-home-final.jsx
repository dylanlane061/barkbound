// ============================================================
//  TRIPS (gallery / home) — pixel-final
// ============================================================

/* ---- enriched trip data: route geometry + PawSignal top picks ---- */
const TRIPS_X = [
  {
    id: 'sedona', name: 'Sedona Fall Road Trip', region: 'Arizona & Utah', status: 'active', active: true,
    updated: '2 days ago', nights: 6, miles: 310, stopCount: 3, places: 8, tone: 'rust', glyph: 'trail',
    picks: [{ cat: 'brewery', score: 92, name: 'Dark Sky Brewing' }, { cat: 'park', score: 88, name: 'Buffalo Park' }, { cat: 'trail', score: 84, name: 'Fatmans Loop' }],
    next: 'Flagstaff',
  },
  {
    id: 'colorado', name: 'Colorado Mountains Weekend', region: 'Colorado', status: 'planning',
    updated: 'last week', nights: 4, miles: 240, stopCount: 5, places: 18, tone: 'green', glyph: 'trees',
    picks: [{ cat: 'trail', score: 90 }, { cat: 'campground', score: 79 }, { cat: 'restaurant', score: 71 }],
  },
  {
    id: 'pnw', name: 'Pacific Northwest Adventure', region: 'Oregon & Washington', status: 'past',
    updated: 'Apr 12', nights: 3, miles: 180, stopCount: 2, places: 6, tone: 'cool', glyph: 'trees',
    picks: [{ cat: 'park', score: 86 }, { cat: 'hotel', score: 64 }],
  },
  {
    id: 'moab', name: 'Moab Desert Loop', region: 'Utah', status: 'past',
    updated: 'Mar 30', nights: 5, miles: 295, stopCount: 4, places: 14, tone: 'sand', glyph: 'camp',
    picks: [{ cat: 'campground', score: 88 }, { cat: 'trail', score: 74 }, { cat: 'dogpark', score: 58 }],
  },
];
const STATUS_META = {
  active: { label: 'Active trip' },
  planning: { label: 'Planning', color: 'var(--slate)', bg: 'var(--slate-bg)', line: 'var(--slate-line)' },
  past: { label: 'Past', color: 'var(--muted)', bg: 'var(--paper-2)', line: 'var(--line)' },
};

/* ---- trip cover: a selectable placeholder image (user picks their own later) ---- */
function TripCover({ trip, h = 150, big }) {
  return (
    <div style={{ position: 'relative', height: h, overflow: 'hidden' }} className="trip-cover">
      <Photo h="100%" tone={trip.tone} glyph={trip.glyph} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(20,53,42,0.04), rgba(20,53,42,0.16))' }} />
      <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(3px)', borderRadius: 8, padding: '5px 9px' }}>
        <Ic name="pin" size={13} color="var(--green-700)" />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>{trip.region}</span>
      </div>
      {/* change-cover affordance (placeholder picker comes with trip creation) */}
      <button className="cover-edit" onClick={(e) => e.stopPropagation()} title="Change cover photo"
        style={{ position: 'absolute', right: 12, bottom: 12, width: big ? 34 : 30, height: big ? 34 : 30, borderRadius: 9, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)' }}>
        <Ic name="map" size={big ? 17 : 15} color="var(--green-800)" />
      </button>
    </div>
  );
}

/* ---- PawSignal top-pick chips ---- */
function PickChips({ picks, max = 3 }) {
  return (
    <div className="row wrap" style={{ gap: 6 }}>
      {picks.slice(0, max).map((p, i) => {
        const col = CONF_VAR[confOf(p.score)];
        return (
          <span key={i} className="row center" style={{ gap: 5, border: `1.5px solid ${col}`, borderRadius: 999, padding: '3px 9px 3px 7px', background: 'var(--card)' }}>
            <Ic name={CATS[p.cat].icon} size={12} color={col} />
            <span className="display" style={{ fontWeight: 800, fontSize: 12.5, color: col, lineHeight: 1 }}>{p.score}</span>
          </span>
        );
      })}
    </div>
  );
}

/* small status pill (top-right of a card) */
function StatusPill({ status }) {
  if (status === 'active') {
    return (
      <span className="row center" style={{ gap: 6, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: '#fff', background: 'var(--orange)', padding: '4px 10px', borderRadius: 999, boxShadow: 'var(--sh-sm)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />Active
      </span>
    );
  }
  const m = STATUS_META[status];
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: m.color,
      background: m.bg, border: `1px solid ${m.line}`, padding: '3px 9px', borderRadius: 999 }}>{m.label}</span>
  );
}

/* compact stat (icon + value) */
function Stat({ icon, children }) {
  return (
    <span className="row center" style={{ gap: 6, whiteSpace: 'nowrap', fontSize: 13, color: 'var(--ink-2)' }}>
      <Ic name={icon} size={15} color="var(--green-700)" />{children}
    </span>
  );
}

/* ---- featured active-trip spotlight ---- */
function FeaturedTrip({ trip, go }) {
  return (
    <div className="card card-lift" style={{ overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(280px, 0.82fr) 1fr', marginBottom: 32 }}
      onClick={() => go('trip', { trip: trip.id })}>
      <div style={{ position: 'relative', minHeight: 248 }}>
        <TripCover trip={trip} h="100%" big />
        <div style={{ position: 'absolute', left: 16, top: 16 }}><StatusPill status="active" /></div>
      </div>
      <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column' }}>
        <div className="row center" style={{ gap: 10, marginBottom: 9 }}>
          <span className="eyebrow">Continue planning</span>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updated {trip.updated}</span>
        </div>
        <h2 className="display" style={{ fontWeight: 800, fontSize: 27, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}>{trip.name}</h2>
        <div className="row center" style={{ gap: 8, marginTop: 8 }}>
          <span className="row center" style={{ gap: 5, fontSize: 13, fontWeight: 600, color: 'var(--green-700)' }}><Ic name="pin" size={14} color="var(--green-700)" />Next up · {trip.next}</span>
        </div>
        <div className="row wrap" style={{ gap: 18, marginTop: 16 }}>
          <Stat icon="pin">{trip.stopCount} stops</Stat>
          <Stat icon="bookmark">{trip.places} places saved</Stat>
          <Stat icon="route">{trip.miles} miles</Stat>
          <Stat icon="clock">{trip.nights} nights</Stat>
        </div>

        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
          <div className="label" style={{ marginBottom: 11 }}>Top picks so far</div>
          <div className="col" style={{ gap: 8 }}>
            {trip.picks.map((p, i) => {
              const col = CONF_VAR[confOf(p.score)];
              return (
                <div key={i} className="row center" style={{ gap: 10 }}>
                  <span className="row center" style={{ gap: 6, width: 30 }}>
                    <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--green-tint-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Ic name={CATS[p.cat].icon} size={14} color="var(--green-700)" />
                    </span>
                  </span>
                  <span className="grow" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{CATS[p.cat].label}</span>
                  <span className="display" style={{ fontWeight: 800, fontSize: 15, color: col, minWidth: 24, textAlign: 'right' }}>{p.score}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grow" />
        <div className="row" style={{ gap: 10, marginTop: 22 }}>
          <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); go('trip', { trip: trip.id }); }}>Open trip<Ic name="arrow" size={16} color="#fff" /></button>
          <button className="btn btn-ghost" onClick={(e) => e.stopPropagation()}><Ic name="share" size={16} color="var(--green-800)" />Share</button>
        </div>
      </div>
    </div>
  );
}

/* ---- gallery card ---- */
function TripCardX({ trip, go }) {
  return (
    <div className="card card-lift" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onClick={() => go('trip', { trip: trip.id })}>
      <div style={{ position: 'relative' }}>
        <TripCover trip={trip} h={150} />
        <div style={{ position: 'absolute', right: 12, top: 12 }}><StatusPill status={trip.status} /></div>
      </div>
      <div style={{ padding: '15px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="display" style={{ fontWeight: 700, fontSize: 17, color: 'var(--green-900)', lineHeight: 1.2 }}>{trip.name}</div>
        <div className="row wrap" style={{ gap: 14, marginTop: 11 }}>
          <Stat icon="pin">{trip.stopCount}</Stat>
          <Stat icon="bookmark">{trip.places}</Stat>
          <Stat icon="route">{trip.miles} mi</Stat>
        </div>
        <div style={{ marginTop: 14 }}>
          {trip.picks && trip.picks.length > 0
            ? <PickChips picks={trip.picks} />
            : <span className="row g6 center" style={{ fontSize: 12, color: 'var(--muted)' }}><Ic name="search" size={13} color="var(--muted)" />No places saved yet</span>}
        </div>
        <div className="grow" />
        <div className="row between center" style={{ marginTop: 15, paddingTop: 13, borderTop: '1px solid var(--line)' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Updated {trip.updated}</span>
          <span className="row center" style={{ gap: 4, fontSize: 12.5, fontWeight: 600, color: 'var(--green-800)' }}>Open<Ic name="chevron" size={14} color="var(--green-700)" /></span>
        </div>
      </div>
    </div>
  );
}

/* ---- new-trip card ---- */
function NewTripCardX({ onClick }) {
  return (
    <button onClick={onClick} style={{ appearance: 'none', cursor: 'pointer', minHeight: 280, border: '1.5px dashed var(--line-2)',
      borderRadius: 16, background: 'var(--green-tint-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, color: 'var(--green-800)', transition: 'border-color .15s, background .15s', fontFamily: 'var(--f-body)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green-600)'; e.currentTarget.style.background = 'var(--green-tint)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.background = 'var(--green-tint-2)'; }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--sh-sm)' }}>
        <Ic name="plus" size={24} color="var(--green-800)" stroke={2} />
      </div>
      <span style={{ fontWeight: 600, fontSize: 14.5 }}>Start a new trip</span>
      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Plan a dog-friendly adventure</span>
    </button>
  );
}

/* ---- segmented filter ---- */
function FilterTabs({ value, setValue, counts }) {
  const tabs = ['All', 'Active', 'Planning', 'Past'];
  return (
    <div style={{ display: 'flex', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 999, padding: 4, gap: 2 }}>
      {tabs.map(t => {
        const on = value === t;
        return (
          <button key={t} onClick={() => setValue(t)} className="row center" style={{ gap: 7, appearance: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 15px', borderRadius: 999, fontFamily: 'var(--f-body)', fontSize: 13, fontWeight: on ? 600 : 500,
            background: on ? 'var(--card)' : 'transparent', color: on ? 'var(--green-900)' : 'var(--ink-2)', boxShadow: on ? 'var(--sh-sm)' : 'none', transition: 'background .14s, color .14s' }}>
            {t}
            <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--green-700)' : 'var(--muted)' }}>{counts[t]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- loading skeleton ---- */
function SkeletonHome() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px 80px', width: '100%' }}>
      <div className="sk" style={{ width: 130, height: 12, marginBottom: 12 }} />
      <div className="sk" style={{ width: 180, height: 34, marginBottom: 28 }} />
      <div className="sk" style={{ width: '100%', height: 252, borderRadius: 16, marginBottom: 32 }} />
      <div className="sk" style={{ width: 280, height: 40, borderRadius: 999, marginBottom: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {[0, 1, 2].map(i => <div key={i} className="sk" style={{ height: 320, borderRadius: 16 }} />)}
      </div>
    </div>
  );
}

Object.assign(window, { TRIPS_X, STATUS_META, TripCover, PickChips, StatusPill, Stat, FeaturedTrip, TripCardX, NewTripCardX, FilterTabs, SkeletonHome });
