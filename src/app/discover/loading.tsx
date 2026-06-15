// Loading skeleton for Discover results (split list/map, ported from SkeletonStop).
export default function Loading() {
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(440px, 1fr) 1fr', alignItems: 'start' }}>
        <div style={{ padding: '20px 28px 60px' }}>
          <div className="sk" style={{ width: 280, height: 12, marginBottom: 18 }} />
          <div className="sk" style={{ width: 220, height: 28, marginBottom: 10 }} />
          <div className="sk" style={{ width: 260, height: 12, marginBottom: 22 }} />
          <div className="col g14">
            {[0, 1, 2, 3].map((i) => (
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
        <div style={{ position: 'sticky', top: 126, height: 'calc(100vh - 126px)', minHeight: 520 }}>
          <div className="sk" style={{ height: '100%', borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}
