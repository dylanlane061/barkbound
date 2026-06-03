// ============================================================
//  TRIPS (gallery / home) — pixel-final orchestrator + mount
// ============================================================

function PreviewToolbar({ replay }) {
  return (
    <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 110,
      background: 'var(--ink)', borderRadius: 999, padding: '5px 6px', boxShadow: 'var(--sh-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', padding: '0 6px 0 8px' }}>Trips · Gallery</span>
      <button onClick={replay} className="row g6 center" style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 999,
        fontFamily: 'var(--f-body)', fontSize: 12.5, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
        <Ic name="refresh" size={14} color="#fff" />Replay load
      </button>
    </div>
  );
}

function HomeFinal() {
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [creating, setCreating] = useState(false);
  const [extraTrips, setExtraTrips] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const load = () => { setLoading(true); return setTimeout(() => setLoading(false), 950); };
  useEffect(() => { const t = load(); return () => { clearTimeout(t); clearTimeout(toastTimer.current); }; }, []);
  const replay = () => load();

  const go = navTo;

  // ---- create-trip modal ----
  const TONE_GLYPH = { sand: 'camp', green: 'trees', cool: 'trees', rust: 'trail', alpine: 'trees' };
  const onCreate = ({ name, region, when, tone }) => {
    const trip = {
      id: 'new' + Date.now(), name, region: region || 'Add a region', status: 'planning',
      updated: 'just now', nights: 0, miles: 0, stopCount: 0, places: 0,
      tone: tone || 'green', glyph: TONE_GLYPH[tone] || 'trees', picks: [], when,
    };
    setExtraTrips(prev => [trip, ...prev]);
    setCreating(false);
    setFilter('All');
    clearTimeout(toastTimer.current);
    setToast(`“${name}” created — add your first stop`);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const allTrips = [...extraTrips, ...TRIPS_X];
  const counts = {
    All: allTrips.length,
    Active: allTrips.filter(t => t.status === 'active').length,
    Planning: allTrips.filter(t => t.status === 'planning').length,
    Past: allTrips.filter(t => t.status === 'past').length,
  };
  const filtered = filter === 'All' ? allTrips : allTrips.filter(t => t.status === filter.toLowerCase());
  const featured = filtered.find(t => t.status === 'active');
  const gridTrips = filtered.filter(t => t !== featured);
  const totalPlaces = allTrips.reduce((s, t) => s + t.places, 0);

  return (
    <div className="appwrap">
      <TopBar active="home" go={go} />
      <div className="grow">
        {loading ? <SkeletonHome /> : (
          <div className="screen-anim" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px 90px', width: '100%' }}>

            {/* header */}
            <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Your adventures</div>
                <h1 className="display" style={{ fontWeight: 800, fontSize: 34, color: 'var(--green-900)', margin: 0, letterSpacing: '-0.02em' }}>Trips</h1>
                <p style={{ fontSize: 14.5, color: 'var(--ink-2)', margin: '8px 0 0' }}>{allTrips.length} adventures planned · {totalPlaces} dog-friendly places researched</p>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => setCreating(true)}><Ic name="plus" size={18} color="#fff" stroke={2} />New trip</button>
            </div>

            {/* featured spotlight */}
            {featured && <FeaturedTrip trip={featured} go={go} />}

            {/* gallery */}
            <div className="row between center" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 className="display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--green-900)', margin: 0 }}>
                {filter === 'All' ? 'All trips' : `${filter} trips`}
              </h2>
              <FilterTabs value={filter} setValue={setFilter} counts={counts} />
            </div>

            {gridTrips.length === 0 && !featured ? (
              <div className="card" style={{ padding: '46px 28px', textAlign: 'center', borderStyle: 'dashed', background: 'var(--paper)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Ic name="route" size={26} color="var(--muted)" />
                </div>
                <div className="display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--green-900)', marginBottom: 6 }}>No {filter.toLowerCase()} trips</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '0 auto 18px', maxWidth: 320, lineHeight: 1.5 }}>Switch filters or start planning a new dog-friendly adventure.</p>
                <button className="btn btn-ghost btn-sm" onClick={() => setFilter('All')} style={{ margin: '0 auto' }}>Show all trips</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {gridTrips.map(t => <TripCardX key={t.id} trip={t} go={go} />)}
                <NewTripCardX onClick={() => setCreating(true)} />
              </div>
            )}
          </div>
        )}
      </div>
      <PreviewToolbar replay={replay} />
      {creating && <CreateTripModal onClose={() => setCreating(false)} onCreate={onCreate} />}
      {toast && (
        <div className="toast-pop" style={{ position: 'fixed', bottom: 78, left: '50%', transform: 'translateX(-50%)', zIndex: 120,
          background: 'var(--green-900)', color: '#fff', borderRadius: 12, padding: '12px 16px', boxShadow: 'var(--sh-lg)', display: 'flex', alignItems: 'center', gap: 10, maxWidth: '90vw' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic name="check" size={14} color="#fff" stroke={2.4} />
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<HomeFinal />);
