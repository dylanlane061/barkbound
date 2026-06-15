// Loading skeleton for the Trips gallery (ported from the design's SkeletonHome).
export default function Loading() {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px 80px', width: '100%' }}>
      <div className="sk" style={{ width: 130, height: 12, marginBottom: 12 }} />
      <div className="sk" style={{ width: 180, height: 34, marginBottom: 28 }} />
      <div className="sk" style={{ width: '100%', height: 252, borderRadius: 16, marginBottom: 32 }} />
      <div className="sk" style={{ width: 280, height: 40, borderRadius: 999, marginBottom: 22 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="sk" style={{ height: 320, borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}
