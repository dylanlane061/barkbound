// Loading skeleton for Place Detail (gallery + two-column body).
export default function Loading() {
  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 28px 80px', width: '100%' }}>
      <div className="sk" style={{ width: 320, height: 12, marginBottom: 18 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, height: 280, marginBottom: 28 }}>
        <div className="sk" style={{ height: '100%', borderRadius: 16 }} />
        <div className="col g12" style={{ height: '100%' }}>
          <div className="sk" style={{ height: '100%', borderRadius: 16 }} />
          <div className="sk" style={{ height: '100%', borderRadius: 16 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 36, alignItems: 'start' }}>
        <div>
          <div className="sk" style={{ width: 140, height: 12, marginBottom: 12 }} />
          <div className="sk" style={{ width: 320, height: 34, marginBottom: 12 }} />
          <div className="sk" style={{ width: 220, height: 12, marginBottom: 22 }} />
          <div className="col g8">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="sk" style={{ width: '100%', height: 60, borderRadius: 12 }} />
            ))}
          </div>
        </div>
        <div className="sk" style={{ height: 320, borderRadius: 16 }} />
      </div>
    </div>
  );
}
