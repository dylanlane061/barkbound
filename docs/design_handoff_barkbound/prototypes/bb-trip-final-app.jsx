// ============================================================
//  TRIP DETAIL — pixel-final orchestrator + mount
// ============================================================

function PreviewToolbar({ replay }) {
  return (
    <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 110,
      background: 'var(--ink)', borderRadius: 999, padding: '5px 6px', boxShadow: 'var(--sh-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', padding: '0 6px 0 8px' }}>Trip · Sedona Fall Road Trip</span>
      <button onClick={replay} className="row g6 center" style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 999,
        fontFamily: 'var(--f-body)', fontSize: 12.5, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
        <Ic name="refresh" size={14} color="#fff" />Reset itinerary
      </button>
    </div>
  );
}

function TripFinal() {
  const [loading, setLoading] = useState(true);
  const [stops, setStops] = useState(() => INITIAL_STOPS.map(s => ({ ...s })));

  const load = () => { setLoading(true); return setTimeout(() => setLoading(false), 1000); };
  useEffect(() => { const t = load(); return () => clearTimeout(t); }, []);
  const replay = () => { setStops(INITIAL_STOPS.map(s => ({ ...s }))); load(); };

  const go = navTo;

  // ---- editing ops ----
  const moveStop = (index, dir) => setStops(prev => {
    const next = [...prev];
    const j = index + dir;
    if (j < 0 || j >= next.length) return prev;
    [next[index], next[j]] = [next[j], next[index]];
    return next;
  });
  const removePlace = (uid, placeId) => setStops(prev => prev.map(s => s.uid === uid ? { ...s, saved: s.saved.filter(id => id !== placeId) } : s));
  const removeStop = (uid) => setStops(prev => prev.filter(s => s.uid !== uid));
  const addStop = (town) => setStops(prev => [...prev, {
    uid: 'u' + Date.now(), town: town.town, name: town.name, state: town.state,
    color: NEW_COLORS[prev.length % NEW_COLORS.length], nights: 1, dates: '', note: '', saved: [],
  }]);

  // ---- derived ----
  const places = stops.reduce((n, s) => n + s.saved.length, 0);
  const miles = stops.reduce((sum, s, i) => i === 0 ? 0 : sum + ((legBetween(stops[i - 1].town, s.town) || {}).mi || 0), 0);
  const nights = stops.reduce((n, s) => n + (s.nights || 0), 0);
  const stats = { stops: stops.length, places, miles, nights };
  const existingTowns = stops.map(s => s.town);
  const canRemoveStop = stops.length > 1;

  return (
    <div className="appwrap">
      <TopBar active="trip" go={go} />
      <div className="grow">
        {loading ? <SkeletonTrip /> : (
          <div className="screen-anim">
            <TripHero stats={stats} go={go} />
            <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', padding: '24px 28px 80px' }}>

              <div className="row between center" style={{ marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
                <h2 className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-900)', margin: 0 }}>Route &amp; saved places</h2>
                <span className="row g6 center" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  <Ic name="sliders" size={14} color="var(--muted)" />Reorder with the arrows · remove on hover
                </span>
              </div>

              <div>
                {stops.map((s, i) => (
                  <div key={s.uid}>
                    {i > 0 && <div style={{ paddingLeft: 50 }}><Leg leg={legBetween(stops[i - 1].town, s.town)} name={s.name} /></div>}
                    <StopSection stop={s} n={i + 1} index={i} total={stops.length}
                      onMoveUp={() => moveStop(i, -1)} onMoveDown={() => moveStop(i, 1)}
                      onRemovePlace={removePlace} onRemoveStop={canRemoveStop ? removeStop : null} go={go} />
                  </div>
                ))}
              </div>

              <AddStopPanel existingTowns={existingTowns} onAdd={addStop} />

              <div className="row g8 center" style={{ marginTop: 24, paddingLeft: 50, fontSize: 12, color: 'var(--muted)' }}>
                <Ic name="shield" size={14} color="var(--muted)" />
                PawSignal scores estimate dog-friendliness from public evidence — always confirm before you go.
              </div>
            </div>
          </div>
        )}
      </div>
      <PreviewToolbar replay={replay} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<TripFinal />);
