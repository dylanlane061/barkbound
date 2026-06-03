// ============================================================
//  MODALS — Create Trip & Add Stop
// ============================================================
function Modal({ onClose, children, width = 540 }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, []);
  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ maxWidth: width }}>{children}</div>
    </div>
  );
}

function ModalHead({ eyebrow, title, onClose }) {
  return (
    <div className="row between" style={{ alignItems: 'flex-start', padding: '22px 24px 16px', borderBottom: '1px solid var(--line)' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 8px)' }}>{eyebrow}</div>
        <h2 className="display" style={{ fontWeight: 800, fontSize: 23, color: 'var(--green-900)', margin: 0, whiteSpace: 'nowrap' }}>{title}</h2>
      </div>
      <button className="btn btn-quiet" style={{ padding: 8, marginTop: -2, marginRight: -4 }} onClick={onClose}>
        <Ic name="x" size={20} color="var(--muted)" />
      </button>
    </div>
  );
}

/* ---------------- Create Trip ---------------- */
const COVER_TONES = ['sand', 'green', 'cool'];
function CreateTripModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [when, setWhen] = useState('');
  const [cover, setCover] = useState(0);
  const [hasCover, setHasCover] = useState(false);
  const ref = useRef(null);
  useEffect(() => { setTimeout(() => ref.current && ref.current.focus(), 80); }, []);
  const valid = name.trim().length > 0;
  return (
    <Modal onClose={onClose} width={540}>
      <ModalHead eyebrow="New adventure" title="Create a trip" onClose={onClose} />
      <div className="scroll" style={{ padding: 24, overflowY: 'auto', overflowX: 'hidden' }}>
        {/* cover */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          {hasCover ? (
            <div style={{ position: 'relative' }}>
              <Photo h={132} tone={COVER_TONES[cover]} round={14} />
              <div className="row g8" style={{ position: 'absolute', bottom: 10, right: 10 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setCover(c => (c + 1) % COVER_TONES.length)}>Shuffle</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setHasCover(false)}><Ic name="x" size={14} color="var(--green-800)" /></button>
              </div>
            </div>
          ) : (
            <button onClick={() => setHasCover(true)} style={{ width: '100%', height: 132, border: '1.5px dashed var(--line-2)', borderRadius: 14,
              background: 'var(--paper-2)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9, color: 'var(--green-800)', fontFamily: 'var(--f-body)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-600)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line-2)'}>
              <Ic name="share" size={22} color="var(--green-700)" />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Add a cover photo</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Optional · drag an image or browse</span>
            </button>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Trip name</label>
          <input ref={ref} className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sedona Fall Road Trip" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">Where are you headed? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· optional</span></label>
          <div className="input-wrap"><span className="input-ic"><Ic name="pin" size={17} color="var(--muted)" /></span>
            <input className="input" value={region} onChange={e => setRegion(e.target.value)} placeholder="Region or starting town" /></div>
        </div>
        <div>
          <label className="field-label">When? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· optional</span></label>
          <div className="input-wrap"><span className="input-ic"><Ic name="clock" size={17} color="var(--muted)" /></span>
            <input className="input" value={when} onChange={e => setWhen(e.target.value)} placeholder="Add dates" /></div>
        </div>
      </div>
      <div className="row between center" style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: 'var(--paper)', borderRadius: '0 0 22px 22px' }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>You can add stops next.</span>
        <div className="row g10">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!valid} style={{ opacity: valid ? 1 : 0.45, pointerEvents: valid ? 'auto' : 'none' }}
            onClick={() => onCreate({ name: name.trim(), region, when, tone: COVER_TONES[cover] })}>
            <Ic name="plus" size={17} color="#fff" stroke={2} />Create trip
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Add Stop ---------------- */
const STOP_SUGGESTIONS = [
  { id: 'williams', name: 'Williams', state: 'AZ', meta: 'On Route 66 · ~35 mi from Flagstaff', note: 'Dog-friendly main street', x: 22, y: 50 },
  { id: 'jerome', name: 'Jerome', state: 'AZ', meta: 'Historic hill town · ~30 mi from Sedona', note: 'Patios welcome dogs', x: 44, y: 58 },
  { id: 'cottonwood', name: 'Cottonwood', state: 'AZ', meta: 'Verde Valley · ~20 mi from Sedona', note: 'Riverfront trails', x: 40, y: 50 },
  { id: 'page', name: 'Page', state: 'AZ', meta: 'Lake Powell · ~130 mi from Moab', note: 'Open desert hikes', x: 64, y: 34 },
  { id: 'monument', name: 'Monument Valley', state: 'UT', meta: 'On the way to Moab · ~150 mi', note: 'Leashed dogs on trails', x: 78, y: 30 },
];
function AddStopModal({ tripName, existing, onClose, onAdd }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const ref = useRef(null);
  useEffect(() => { setTimeout(() => ref.current && ref.current.focus(), 80); }, []);
  const results = STOP_SUGGESTIONS.filter(s => !q || (s.name + s.state).toLowerCase().includes(q.toLowerCase()));
  const selObj = STOP_SUGGESTIONS.find(s => s.id === sel);
  const existingPins = (existing || []).map(s => ({ x: s.x, y: s.y, n: s.n }));
  return (
    <Modal onClose={onClose} width={760}>
      <ModalHead eyebrow={`Add to ${tripName}`} title="Add a stop" onClose={onClose} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', minHeight: 0 }}>
        {/* left: search + suggestions */}
        <div className="scroll" style={{ padding: 24, overflowY: 'auto', overflowX: 'hidden', maxHeight: 460 }}>
          <div className="input-wrap" style={{ marginBottom: 8 }}>
            <span className="input-ic"><Ic name="search" size={18} color="var(--muted)" /></span>
            <input ref={ref} className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search a town or city" />
          </div>
          <div className="label" style={{ margin: '16px 0 10px' }}>{q ? 'Results' : 'Suggested along your route'}</div>
          <div className="col g8">
            {results.map(s => {
              const on = sel === s.id;
              return (
                <button key={s.id} onClick={() => setSel(s.id)} className="row g12 center" style={{ width: '100%', textAlign: 'left',
                  padding: '12px 13px', borderRadius: 12, cursor: 'pointer', fontFamily: 'var(--f-body)',
                  background: on ? 'var(--green-tint)' : 'var(--card)', border: `1px solid ${on ? 'var(--green-600)' : 'var(--line-2)'}`, transition: 'all .14s' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: on ? 'var(--green-800)' : 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic name="pin" size={18} color={on ? '#fff' : 'var(--green-700)'} />
                  </div>
                  <div className="grow">
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.name}, {s.state}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.meta}</div>
                  </div>
                  <span className="row g6 center" style={{ fontSize: 11, color: 'var(--hi)', fontWeight: 600, flexShrink: 0 }}>
                    <Ic name="check" size={12} color="var(--hi)" stroke={2.4} />{s.note}
                  </span>
                </button>
              );
            })}
            {results.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', padding: '20px 0', textAlign: 'center' }}>No matches. Try another town.</div>}
          </div>
        </div>
        {/* right: map preview */}
        <div style={{ borderLeft: '1px solid var(--line)', position: 'relative' }}>
          <TerrainMap h="100%" rounded={0}
            pins={[...existingPins, ...(selObj ? [{ x: selObj.x, y: selObj.y, n: (existing?.length || 0) + 1, active: true }] : [])]}>
            <div style={{ position: 'absolute', left: 12, top: 12, background: 'var(--card)', borderRadius: 9, padding: '7px 11px', boxShadow: 'var(--sh)', fontSize: 12, fontWeight: 600, color: 'var(--ink-2)' }}>
              {selObj ? `${selObj.name}, ${selObj.state}` : `${existing?.length || 0} stops on route`}
            </div>
          </TerrainMap>
        </div>
      </div>
      <div className="row between center" style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: 'var(--paper)', borderRadius: '0 0 22px 22px' }}>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{selObj ? `Adding ${selObj.name}` : 'Pick a stop to add'}</span>
        <div className="row g10">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!selObj} style={{ opacity: selObj ? 1 : 0.45, pointerEvents: selObj ? 'auto' : 'none' }}
            onClick={() => onAdd(selObj)}><Ic name="plus" size={17} color="#fff" stroke={2} />Add stop</button>
        </div>
      </div>
    </Modal>
  );
}

window.Modal = Modal;
window.CreateTripModal = CreateTripModal;
window.AddStopModal = AddStopModal;
