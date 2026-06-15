export default function Spinner({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <span
      className="bb-spin"
      style={{ width: size, height: size, borderTopColor: color || 'var(--green-700)' }}
    />
  );
}
