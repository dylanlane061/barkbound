export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-4 w-28 rounded bg-stone-200" />

        <div className="mt-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="h-8 w-2/3 rounded bg-stone-200" />
            <div className="mt-2 h-4 w-32 rounded bg-stone-200" />
          </div>
          <div className="h-8 w-20 rounded-full bg-stone-200" />
        </div>

        <ul className="mt-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="h-14 rounded-lg border border-stone-200 bg-white" />
          ))}
        </ul>
      </div>
    </main>
  );
}
