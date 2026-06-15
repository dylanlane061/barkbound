// ============================================================
//  STOP / DISCOVERY — pixel-final orchestrator + mount
// ============================================================

/* ---- save toast ---- */
function Toast({ msg, sub, onClose, go }) {
  useEffect(() => { const t = setTimeout(onClose, 3400); return () => clearTimeout(t); }, [msg]);
  return (
    <div className="toast" style={{ position: 'fixed', bottom: 92, left: '50%', transform: 'translateX(-50%)', zIndex: 120,
      background: 'var(--ink)', color: '#fff', borderRadius: 14, padding: '13px 16px', boxShadow: 'var(--sh-pop)', display: 'flex', alignItems: 'center', gap: 14, minWidth: 320 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic name="check" size={17} color="#fff" stroke={2.6} />
      </div>
      <div className="grow">
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{msg}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{sub}</div>
      </div>
      <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', padding: '7px 12px' }} onClick={() => go('trip', { trip: 'sedona' })}>View trip</button>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.6)' }}><Ic name="x" size={16} color="rgba(255,255,255,0.6)" /></button>
    </div>
  );
}

/* ---- preview chrome ---- */
function PreviewToolbar({ replay, label }) {
  return (
    <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 110,
      background: 'var(--ink)', borderRadius: 999, padding: '5px 6px', boxShadow: 'var(--sh-lg)', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', padding: '0 6px 0 8px' }}>{label}</span>
      <button onClick={replay} className="row g6 center" style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 999,
        fontFamily: 'var(--f-body)', fontSize: 12.5, fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
        <Ic name="arrow" size={14} color="#fff" style={{ transform: 'rotate(-45deg)' }} />{label.includes('Search') ? 'Reset' : 'Replay load'}
      </button>
    </div>
  );
}

function StopFinal() {
  // route context: a `stop` param means we arrived from a trip's "Discover more near…";
  // no param means we opened the Discover tab directly → search empty state.
  const route0 = (() => { try { return JSON.parse(localStorage.getItem('bb_route') || '{}'); } catch (e) { return {}; } })();
  const arrivedStop = route0 && route0.params && route0.params.stop;
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const initialLoc = arrivedStop ? ((STOPS.find(s => s.id === arrivedStop) || {}).name || cap(arrivedStop)) : null;

  const [loc, setLoc] = useState(initialLoc);        // null → search state
  const [fromTrip, setFromTrip] = useState(!!arrivedStop);
  const [loading, setLoading] = useState(!!initialLoc);
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [sort, setSort] = useState('Confidence');
  const [radius, setRadius] = useState(25);
  const [cats, setCats] = useState(() => Object.fromEntries(FILTERS.map(([k]) => [k, true])));
  const [saved, setSaved] = useState(() => new Set());
  const [toast, setToast] = useState(null);
  // per-place check lifecycle
  const [status, setStatus] = useState(() => Object.fromEntries(DISCO.map(p => [p.id, p.init])));
  const [progress, setProgress] = useState({}); // id -> sources revealed
  const timers = useRef([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const load = () => { setLoading(true); const t = setTimeout(() => setLoading(false), 1150); return t; };
  useEffect(() => { if (!initialLoc) return; const t = load(); return () => { clearTimeout(t); clearTimers(); }; }, []);
  useEffect(() => () => clearTimers(), []);
  const replay = () => {
    clearTimers();
    setSelected(null); setProgress({});
    setStatus(Object.fromEntries(DISCO.map(p => [p.id, p.init])));
    if (loc) load();
  };
  // a location was chosen from the search empty state
  const pickLocation = (name) => {
    clearTimers();
    setSelected(null); setProgress({}); setHover(null);
    setStatus(Object.fromEntries(DISCO.map(p => [p.id, p.init])));
    setFromTrip(false);
    setLoc(name);
    window.scrollTo(0, 0);
    timers.current.push(load());
  };
  // back to the search empty state
  const toSearch = () => { clearTimers(); setLoc(null); window.scrollTo(0, 0); };

  const go = navTo;

  const toggle = (k) => setCats(c => ({ ...c, [k]: !c[k] }));
  const reset = () => { setCats(Object.fromEntries(FILTERS.map(([k]) => [k, true]))); setRadius(25); };
  const onSave = (id) => {
    setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
    if (!saved.has(id)) setToast({ msg: `Saved ${DISCO.find(p => p.id === id).name}`, sub: `Added to ${loc} · Sedona Fall Road Trip` });
  };
  const onSelect = (id) => setSelected(s => s === id ? null : id);

  // run a PawSignal check for one place: reveal sources, then resolve to its score
  const runCheck = (id) => {
    const p = DISCO.find(x => x.id === id);
    if (!p || status[id] === 'computing' || status[id] === 'scored') return;
    setStatus(s => ({ ...s, [id]: 'computing' }));
    setProgress(pr => ({ ...pr, [id]: 0 }));
    const n = p.sources;
    for (let i = 0; i < n; i++) {
      timers.current.push(setTimeout(() => setProgress(pr => ({ ...pr, [id]: i + 1 })), 600 + i * 720));
    }
    timers.current.push(setTimeout(() => {
      setStatus(s => ({ ...s, [id]: 'scored' }));
      setToast({ msg: `${p.name} scored ${p.score}`, sub: `${CONF_LABEL[confOf(p.score)]} confidence · ${n} sources checked` });
    }, 600 + n * 720 + 500));
  };
  // check every unscored place, staggered so they resolve in sequence
  const runAll = (ids) => ids.forEach((id, i) => timers.current.push(setTimeout(() => runCheck(id), i * 450)));

  // filter; scored places rank above unscored, which keep their listed order
  const filtered = DISCO.filter(p => cats[p.cat] && p.dist <= radius);
  const list = [...filtered].sort((a, b) => {
    const sa = status[a.id] === 'scored', sb = status[b.id] === 'scored';
    if (sa !== sb) return sa ? -1 : 1;
    if (!sa) return 0;
    return sort === 'Confidence' ? b.score - a.score : a.dist - b.dist;
  });
  const listKey = sort + '|' + radius + '|' + FILTERS.filter(([k]) => cats[k]).map(([k]) => k).join(',');
  const scoredCount = list.filter(p => status[p.id] === 'scored').length;
  const unscoredIds = list.filter(p => status[p.id] === 'unscored').map(p => p.id);
  const checkingCount = Object.values(status).filter(s => s === 'computing').length;
  const selPlace = selected != null ? DISCO.find(p => p.id === selected) : null;
  const stOf = (id) => selected === id ? 'sel' : hover === id ? 'hover' : 'idle';
  let rank = 0;

  return (
    <div className="appwrap">
      <TopBar active="stop" go={go} />
      <div className="grow">
        {!loc ? (
          <DiscoverSearch onPick={pickLocation} go={go} />
        ) : loading ? <SkeletonStop /> : (
          <div className="screen-anim">
            <FilterBarX cats={cats} toggle={toggle} radius={radius} setRadius={setRadius} reset={reset} count={list.length} />
            <div style={{ maxWidth: 1320, margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 1fr) 1fr', alignItems: 'start' }}>

                {/* list side */}
                <div style={{ padding: '18px 28px 60px' }}>
                  <Crumb items={fromTrip
                    ? [{ label: 'Trips', go: () => go('home') }, { label: 'Sedona Fall Road Trip', go: () => go('trip', { trip: 'sedona' }) }, { label: loc }]
                    : [{ label: 'Discover', go: toSearch }, { label: loc }]} />
                  <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <h1 className="display" style={{ fontWeight: 800, fontSize: 27, color: 'var(--green-900)', margin: 0 }}>Dog-friendly near {loc}</h1>
                      <p style={{ fontSize: 13.5, color: 'var(--ink-2)', margin: '7px 0 0' }}>
                        <b style={{ color: 'var(--ink)' }}>{list.length} {list.length === 1 ? 'place' : 'places'}</b> within {radius} mi
                        {scoredCount < list.length && <span> · <b style={{ color: 'var(--ink)' }}>{scoredCount} scored</b></span>}
                      </p>
                    </div>
                    <div className="row g6 center">
                      <span className="label" style={{ marginRight: 2 }}>Sort</span>
                      {['Confidence', 'Distance'].map(s => (
                        <button key={s} onClick={() => setSort(s)} className="chip"
                          style={s === sort ? { background: 'var(--green-tint)', borderColor: 'var(--green-600)', color: 'var(--green-800)', fontWeight: 600 } : null}>{s}</button>
                      ))}
                    </div>
                  </div>

                  {/* batch check banner — appears while any place is unscored */}
                  {unscoredIds.length > 0 && (
                    <div className="card" style={{ padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 13, background: 'var(--green-tint-2)', borderColor: 'var(--green-line, var(--line))' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ic name="paw" size={17} color="var(--green-700)" fill="var(--green-700)" stroke={0} />
                      </div>
                      <div className="grow">
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--green-900)' }}>{unscoredIds.length} {unscoredIds.length === 1 ? 'place hasn’t' : 'places haven’t'} been checked</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 1 }}>Run PawSignal across all of them to rank by confidence.</div>
                      </div>
                      <button className="btn btn-orange btn-sm" onClick={() => runAll(unscoredIds)} disabled={checkingCount > 0}
                        style={checkingCount > 0 ? { background: 'var(--green-tint)', color: 'var(--green-800)' } : null}>
                        {checkingCount > 0 ? <React.Fragment><Spinner size={13} />Checking {checkingCount}…</React.Fragment> : <React.Fragment><Ic name="paw" size={13} color="#fff" fill="#fff" stroke={0} />Check all</React.Fragment>}
                      </button>
                    </div>
                  )}

                  {list.length === 0 ? <EmptyState reset={reset} /> : (
                    <div className="col g14" key={listKey}>
                      {list.map((p, i) => {
                        const isScored = status[p.id] === 'scored';
                        if (isScored) rank += 1;
                        return (
                          <ResultCardX key={p.id} p={p} rank={isScored ? rank : null} idx={i}
                            status={status[p.id]} done={progress[p.id] || 0}
                            selected={selected === p.id} saved={saved.has(p.id)}
                            onHover={setHover} onSelect={onSelect} onSave={onSave} onRun={runCheck} go={go} />
                        );
                      })}
                    </div>
                  )}

                  <div className="row g8 center" style={{ marginTop: 18, fontSize: 12, color: 'var(--muted)' }}>
                    <Ic name="clock" size={14} color="var(--muted)" />
                    Scores estimate dog-friendliness from public evidence — always confirm before you go.
                  </div>
                </div>

                {/* map side (sticky) */}
                <div style={{ position: 'sticky', top: 56, height: 'calc(100vh - 56px)', minHeight: 540 }}>
                  <TerrainMap h="100%" style={{ borderLeft: '1px solid var(--line)' }}>
                    <div style={{ position: 'absolute', inset: 0 }} onClick={() => setSelected(null)} />
                    {list.map(p => (
                      <MapPinX key={p.id} p={p} status={status[p.id]} done={progress[p.id] || 0} st={stOf(p.id)}
                        onEnter={() => setHover(p.id)} onLeave={() => setHover(null)}
                        onClick={() => onSelect(p.id)} />
                    ))}
                    <MapControls />
                    <div style={{ position: 'absolute', left: 14, top: 14, background: 'var(--card)', borderRadius: 10, padding: '8px 12px', boxShadow: 'var(--sh)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Ic name="pin" size={15} color="var(--green-700)" /><span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{loc} & {radius} mi</span>
                    </div>
                    <MapLegend />
                    {selPlace && <PeekCard p={selPlace} status={status[selPlace.id]} done={progress[selPlace.id] || 0}
                      saved={saved.has(selPlace.id)} onSave={() => onSave(selPlace.id)} onRun={() => runCheck(selPlace.id)} onClose={() => setSelected(null)} go={go} />}
                  </TerrainMap>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast.msg} sub={toast.sub} onClose={() => setToast(null)} go={go} />}
      <PreviewToolbar replay={replay} label={loc ? `Discover · ${loc}` : 'Discover · Search'} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StopFinal />);
