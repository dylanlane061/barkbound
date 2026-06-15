import Icon from './Icon';

// Paw mark + wordmark. `mono` flips it to white-on-transparent for dark surfaces.
export default function Logo({ size = 26, mono = false }: { size?: number; mono?: boolean }) {
  return (
    <span className="row g8">
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 9,
          background: mono ? '#fff' : 'var(--green-800)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon
          name="paw"
          size={size * 0.62}
          color={mono ? 'var(--green-800)' : '#fff'}
          fill={mono ? 'var(--green-800)' : '#fff'}
          stroke={0}
        />
      </span>
      <span
        className="display"
        style={{
          fontWeight: 800,
          fontSize: size * 0.72,
          color: mono ? '#fff' : 'var(--green-900)',
          letterSpacing: '-0.02em',
        }}
      >
        Barkbound
      </span>
    </span>
  );
}
