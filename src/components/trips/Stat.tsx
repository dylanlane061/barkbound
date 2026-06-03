import Icon, { type IconName } from '@/components/kit/Icon';

// Compact icon + value stat used on trip cards and the spotlight.
export default function Stat({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <span
      className="row center g6"
      style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--ink-2)' }}
    >
      <Icon name={icon} size={15} color="var(--green-700)" />
      {children}
    </span>
  );
}
