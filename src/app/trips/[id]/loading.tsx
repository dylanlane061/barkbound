export default function Loading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-4 w-20 rounded bg-stone-200" />
        <div className="mt-8 h-9 w-64 rounded bg-stone-200" />

        <div className="mt-10 h-4 w-24 rounded bg-stone-200" />
        <div className="mt-3 h-11 w-full rounded-lg border border-stone-200 bg-white" />

        {Array.from({ length: 2 }).map((_, s) => (
          <section key={s} className="mt-10">
            <div className="h-5 w-40 rounded bg-stone-200" />
            <ul className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="h-12 rounded-lg border border-stone-200 bg-white" />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
