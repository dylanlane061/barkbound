import { CONF_VAR, type ConfTier } from '@/lib/design/confidence';
import { CATS, type CatKey } from '@/lib/design/cats';
import Icon from '@/components/kit/Icon';

// Small tier-bordered score pill: a place's category glyph + its PawSignal
// score, bordered in the confidence-tier color. Used on trip cards/spotlight.
export default function PickChip({
  score,
  tier,
  category,
  name,
}: {
  score: number;
  tier: ConfTier;
  category?: CatKey | null;
  name?: string;
}) {
  const col = CONF_VAR[tier];
  return (
    <span
      className="row g6"
      title={name}
      style={{
        border: `1.5px solid ${col}`,
        borderRadius: 'var(--pill)',
        padding: '3px 9px 3px 7px',
        background: 'var(--card)',
        lineHeight: 1,
      }}
    >
      {category && <Icon name={CATS[category].icon} size={13} color={col} stroke={2} />}
      <span className="display" style={{ fontWeight: 800, fontSize: 13, color: col }}>
        {score}
      </span>
    </span>
  );
}
