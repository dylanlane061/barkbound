'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Icon from './Icon';
import Logo from './Logo';

const TABS: { key: string; label: string; href: string }[] = [
  { key: 'trips', label: 'Trips', href: '/trips' },
  { key: 'discover', label: 'Discover', href: '/discover' },
];

// Sticky global nav. "Trips" is active on the trips surfaces (/, /trips,
// /trips/:id); "Discover" on the discover/place surfaces (/discover, /places/:id).
function activeTab(pathname: string): string {
  if (pathname.startsWith('/discover') || pathname.startsWith('/places')) return 'discover';
  return 'trips';
}

export default function TopBar() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const active = activeTab(pathname);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(250,248,243,0.88)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 28px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <Link href="/trips" style={{ textDecoration: 'none' }} aria-label="Barkbound home">
          <Logo size={24} />
        </Link>
        <nav className="row g4" style={{ marginLeft: 8 }}>
          {TABS.map((t) => {
            const on = t.key === active;
            return (
              <Link
                key={t.key}
                href={t.href}
                style={{
                  background: on ? 'var(--green-tint)' : 'transparent',
                  color: on ? 'var(--green-800)' : 'var(--ink-2)',
                  fontFamily: 'var(--f-body)',
                  fontSize: 14,
                  fontWeight: on ? 600 : 500,
                  padding: '9px 15px',
                  borderRadius: 9,
                  textDecoration: 'none',
                  transition: 'background .14s',
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="grow" />
        <button
          onClick={() => router.push('/discover')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            height: 40,
            padding: '0 14px',
            minWidth: 220,
            background: 'var(--card)',
            border: '1px solid var(--line-2)',
            borderRadius: 10,
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: 13.5,
          }}
        >
          <Icon name="search" size={17} color="var(--muted)" /> Search any place…
          <span className="grow" />
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              border: '1px solid var(--line-2)',
              borderRadius: 5,
              padding: '1px 5px',
            }}
          >
            ⌘K
          </span>
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--green-700)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          M
        </div>
      </div>
    </header>
  );
}
