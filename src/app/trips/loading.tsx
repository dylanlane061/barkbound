export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-4 w-16 rounded bg-stone-200" />
        <div className="mt-6 h-9 w-48 rounded bg-stone-200" />
        <ul className="mt-10 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-16 rounded-lg border border-stone-200 bg-white" />
          ))}
        </ul>
      </div>
    </main>
  );
}
