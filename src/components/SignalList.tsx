import type { Signal } from '@pawsignal';

const LABELS: Record<string, string> = {
  pets_allowed: 'Pets allowed',
  size_restriction: 'Size restriction',
  leash_required: 'Leash required',
  pet_fee: 'Pet fee',
  designated_area: 'Designated area',
  water_access: 'Water access',
  trail_access: 'Trail access',
};

type RawRecordRow = {
  id: string;
  source: string;
  sourceEntityId: string;
  raw: unknown;
  fetchedAt: Date;
};

export default function SignalList({
  signals,
  rawRecords = [],
}: {
  signals: Signal[];
  rawRecords?: RawRecordRow[];
}) {
  if (signals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 p-10 text-center text-stone-400">
        No signals collected yet for this place.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {signals.map((signal) => {
        const evidence = rawRecords.filter((r) => signal.evidenceIds.includes(r.id));
        return (
          <li key={signal.id} className="rounded-lg border border-stone-200 bg-white overflow-hidden">
            <details>
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <span className="font-medium">
                  {LABELS[signal.category] ?? signal.category}
                </span>
                <div className="flex items-center gap-3 shrink-0 text-sm">
                  {signal.value !== null && (
                    <span className="text-stone-500">{String(signal.value)}</span>
                  )}
                  <span className="text-stone-400">
                    {Math.round(signal.confidence * 100)}% confidence
                  </span>
                  <span className="text-stone-300 text-xs">▼</span>
                </div>
              </summary>

              {evidence.length > 0 && (
                <div className="border-t border-stone-100 px-5 py-4 space-y-4">
                  {evidence.map((rec) => (
                    <div key={rec.id}>
                      <p className="text-xs font-medium text-stone-400 mb-1">
                        {rec.source} · {rec.sourceEntityId} · fetched{' '}
                        {new Date(rec.fetchedAt).toLocaleDateString()}
                      </p>
                      <pre className="text-xs bg-stone-50 rounded p-3 overflow-auto text-stone-600 leading-relaxed">
                        {JSON.stringify(rec.raw, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </details>
          </li>
        );
      })}
    </ul>
  );
}
