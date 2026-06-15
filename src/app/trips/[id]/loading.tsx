// Loading skeleton for Trip Detail (single column, ported from SkeletonTrip).
export default function Loading() {
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
        {[0, 1, 2].map((i) => (
          <div key={i} className="row g16" style={{ alignItems: 'flex-start' }}>
            <div className="sk" style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0 }} />
            <div className="card grow" style={{ padding: 16 }}>
              <div className="sk" style={{ width: 160, height: 20, marginBottom: 10 }} />
              <div className="sk" style={{ width: 240, height: 12, marginBottom: 16 }} />
              <div className="col g8">
                {[0, 1, 2].map((j) => (
                  <div key={j} className="sk" style={{ width: '100%', height: 66, borderRadius: 12 }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
