import type { Signal } from '@barkbound/pawsignal';

const LABELS: Record<string, string> = {
  pets_allowed: 'Pets allowed',
  size_restriction: 'Size restriction',
  leash_required: 'Leash required',
  pet_fee: 'Pet fee',
  designated_area: 'Designated area',
  water_access: 'Water access',
  trail_access: 'Trail access',
};

export default function SignalList({ signals }: { signals: Signal[] }) {
  if (signals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 p-10 text-center text-stone-400">
        No signals collected yet for this place.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {signals.map((signal) => (
        <li key={signal.id} className="rounded-lg border border-stone-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">{LABELS[signal.category] ?? signal.category}</span>
            <span className="text-sm text-stone-400 shrink-0">
              {Math.round(signal.confidence * 100)}% confidence
            </span>
          </div>
          {signal.value !== null && (
            <p className="text-sm text-stone-500 mt-1">{String(signal.value)}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
