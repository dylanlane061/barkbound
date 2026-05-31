export default function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const colorClass =
    pct >= 70
      ? 'bg-green-100 text-green-800'
      : pct >= 40
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-stone-100 text-stone-500';

  return (
    <div className={`rounded-xl px-4 py-3 text-center min-w-[80px] shrink-0 ${colorClass}`}>
      <p className="text-2xl font-bold leading-none">{pct}%</p>
      <p className="text-xs font-medium mt-1">confidence</p>
    </div>
  );
}
