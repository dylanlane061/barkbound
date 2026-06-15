// ============================================================
//  PLACE DETAIL — pixel-final orchestrator + mount
// ============================================================
function AdvisoryBanner({ text }) {
  return (
    <div className="row g12 center" style={{ padding: '13px 16px', background: 'var(--med-bg)', border: '1px solid var(--med-line)', borderRadius: 12, marginBottom: 18 }}>
      <Ic name="shield" size={20} color="var(--med)" />
      <div className="grow" style={{ fontSize: 13.5, color: 'var(--med)', fontWeight: 600, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

function Toast({ toast, onClose, go }) {
  useEffect(() => { const t = setTimeout(onClose, 3600); return () => clearTimeout(t); }, []);
  return (
    <div className="toast" style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 120,
      background: 'var(--ink)', color: '#fff', borderRadius: 14, padding: '13px 16px', boxShadow: 'var(--sh-pop)', display: 'flex', alignItems: 'center', gap: 14, minWidth: 320 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--hi)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic name={toast.icon || 'check'} size={17} color="#fff" stroke={2.6} />
      </div>
      <div className="grow">
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{toast.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{toast.sub}</div>
      </div>
      {toast.action && <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', padding: '7px 12px' }} onClick={() => go('trip', { trip: 'sedona' })}>{toast.action}</button>}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.6)' }}><Ic name="x" size={16} color="rgba(255,255,255,0.6)" /></button>
    </div>
  );
}

function PreviewToolbar({ sample, setSample, replay }) {
  return (
    <div style={{ position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 110,
      background: 'var(--ink)', borderRadius: 999, padding: 5, boxShadow: 'var(--sh-lg)', display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', padding: '0 10px 0 12px' }}>Preview</span>
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: 3 }}>
        {[['fresh', 'New · Unscored'], ['high', '92 · High'], ['verify', '38 · Verify']].map(([k, l]) => (
          <button key={k} onClick={() => setSample(k)} style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '7px 14px', borderRadius: 999,
            fontFamily: 'var(--f-body)', fontSize: 12.5, fontWeight: 600, transition: 'background .15s',
            background: sample === k ? '#fff' : 'transparent', color: sample === k ? 'var(--ink)' : 'rgba(255,255,255,0.7)' }}>{l}</button>
        ))}
      </div>
      <button onClick={replay} className="row g6 center" style={{ appearance: 'none', border: 'none', cursor: 'pointer', padding: '8px 13px 8px 11px', borderRadius: 999,
        fontFamily: 'var(--f-body)', fontSize: 12.5, fontWeight: 600, background: 'transparent', color: 'rgba(255,255,255,0.85)' }}>
        <Ic name="arrow" size={14} color="rgba(255,255,255,0.85)" style={{ transform: 'rotate(-45deg)' }} />Replay load
      </button>
    </div>
  );
}

function PlaceFinal() {
  const [sample, setSampleRaw] = useState('fresh');
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('unscored'); // unscored | computing | recheck | done
  const [revealed, setRevealed] = useState(0);
  const [open, setOpen] = useState({ 0: true });
  const [toast, setToast] = useState(null);
  const [assessedAt, setAssessedAt] = useState(null); // overrides data.assessed after a re-run
  const data = SAMPLES[sample];
  const timers = useRef([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  const load = () => { setLoading(true); const t = setTimeout(() => setLoading(false), 1250); return t; };
  useEffect(() => { const t = load(); return () => { clearTimeout(t); clearTimers(); }; }, []);

  const setSample = (s) => {
    clearTimers();
    setSampleRaw(s); setOpen({ 0: true }); setToast(null); setRevealed(0); setAssessedAt(null);
    setPhase(s === 'fresh' ? 'unscored' : 'done');
    load();
  };
  const replay = () => {
    clearTimers(); setOpen({ 0: true }); setRevealed(0); setAssessedAt(null);
    setPhase(sample === 'fresh' ? 'unscored' : 'done');
    load();
  };

  // step through the sources on a timer, then run `done(...)`
  const scan = (onDone) => {
    setRevealed(0);
    const n = data.evidence.length;
    for (let i = 0; i < n; i++) {
      timers.current.push(setTimeout(() => setRevealed(i + 1), 650 + i * 850));
    }
    timers.current.push(setTimeout(onDone, 650 + n * 850 + 650));
  };

  // ACT 2 → ACT 3: first-time check
  const runCheck = () => {
    clearTimers(); setPhase('computing');
    scan(() => { setOpen({ 0: true }); setPhase('done'); });
  };

  // RE-RUN: keep the old score dimmed while re-scanning, then refresh + confirm
  const rerun = () => {
    clearTimers(); setToast(null); setPhase('recheck');
    scan(() => {
      setOpen({ 0: true }); setAssessedAt('just now'); setPhase('done');
      setToast({ title: 'Score refreshed', sub: `Re-confirmed at ${data.score} from ${data.sources} sources · just now`, icon: 'refresh' });
    });
  };

  const go = navTo;

  const computingNow = phase === 'computing' || phase === 'recheck';
  const tags = (phase === 'done' || phase === 'recheck') ? data.tags : (data.tagsRaw || data.tags);

  return (
    <div className="appwrap">
      <TopBar active="stop" go={go} />
      <div className="grow">
        {loading ? <SkeletonPlace /> : (
          <div className="screen-anim"><Page max={1180}>
            <Crumb items={[{ label: 'Trips', go: () => go('home') }, { label: 'Sedona Fall Road Trip', go: () => go('trip', { trip: 'sedona' }) }, { label: 'Flagstaff', go: () => go('stop', { stop: 'flagstaff' }) }, { label: data.name }]} />
            <Gallery data={data} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 36, alignItems: 'start' }}>
              <div>
                <div className="row g10 center" style={{ marginBottom: 6 }}>
                  <span className="eyebrow">{CATS[data.cat].label}</span>
                  <span style={{ color: 'var(--line-2)' }}>·</span>
                  <span className="row g6 center" style={{ fontSize: 12.5, color: 'var(--muted)' }}><Ic name="pin" size={14} color="var(--muted)" />{data.dist} mi from Flagstaff</span>
                </div>
                <h1 className="display" style={{ fontWeight: 800, fontSize: 36, color: 'var(--green-900)', margin: '0 0 8px' }}>{data.name}</h1>
                <div className="mono" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{data.addr} · {data.city}</div>
                <p style={{ fontSize: 15.5, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 560 }}>{data.blurb}</p>
                <div className="row g8 wrap" style={{ marginBottom: 28 }}>
                  {tags.map((t, i) => <span key={i} className="chip sand"><Ic name="check" size={13} color={phase === 'done' && data.level === 'hi' ? 'var(--hi)' : 'var(--muted)'} stroke={2.4} />{t}</span>)}
                </div>

                {phase === 'done' && data.advisory && <AdvisoryBanner text={data.advisory} />}

                {phase === 'unscored' && <RequestPanel data={data} onRun={runCheck} />}
                {computingNow && <ComputingPanel data={data} revealed={revealed} recheck={phase === 'recheck'} />}

                {phase === 'done' && (
                  <React.Fragment>
                    <div className="card" style={{ padding: '4px 22px 8px' }}>
                      <div className="row between center" style={{ padding: '18px 0 12px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
                        <div>
                          <div className="row g10 center">
                            <Ic name="shield" size={19} color="var(--green-700)" />
                            <h2 className="display" style={{ fontWeight: 700, fontSize: 19, color: 'var(--green-900)', margin: 0 }}>How PawSignal reached {data.score}</h2>
                          </div>
                          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 0 29px' }}>Open any source to read the exact evidence — never a black box.</p>
                        </div>
                        <span className="label">{data.sources} sources</span>
                      </div>
                      {data.evidence.map((e, i) => (
                        <EvidenceRowX key={i} e={e} open={!!open[i]} last={i === data.evidence.length - 1}
                          onToggle={() => setOpen(o => ({ ...o, [i]: !o[i] }))} />
                      ))}
                    </div>
                    <div className="row g8 center" style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
                      <Ic name="clock" size={14} color="var(--muted)" />
                      Score is an estimate from public evidence, not a guarantee. Always confirm directly before you visit.
                    </div>
                  </React.Fragment>
                )}
              </div>

              {phase === 'done'
                ? <SaveBoxX data={data} assessed={assessedAt} onSaved={(stop) => setToast({ title: `Saved to ${stop}`, sub: 'Added to Sedona Fall Road Trip', action: 'View trip' })} onRerun={rerun} />
                : phase === 'recheck'
                  ? <RecheckSideBox data={data} revealed={revealed} />
                  : <UnscoredSideBox data={data} phase={phase} revealed={revealed} onRun={runCheck} />}
            </div>
          </Page></div>
        )}
      </div>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} go={go} />}
      <PreviewToolbar sample={sample} setSample={setSample} replay={replay} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PlaceFinal />);
