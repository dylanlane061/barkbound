import Link from 'next/link';
import { Fragment } from 'react';
import Icon from './Icon';

export type CrumbItem = { label: string; href?: string };

// Breadcrumb: clickable labels separated by chevrons; the last item is the
// current page (always non-clickable, heavier weight).
export default function Crumb({ items }: { items: CrumbItem[] }) {
  return (
    <div
      className="row g8 wrap"
      style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}
    >
      {items.map((it, i) => {
        const isLast = i === items.length - 1;
        const content = (
          <span
            style={{
              color: isLast ? 'var(--ink)' : 'var(--ink-2)',
              fontWeight: isLast ? 600 : 500,
            }}
          >
            {it.label}
          </span>
        );
        return (
          <Fragment key={i}>
            {i > 0 && <Icon name="chevron" size={13} color="var(--line-2)" />}
            {it.href && !isLast ? (
              <Link href={it.href} style={{ textDecoration: 'none' }}>
                {content}
              </Link>
            ) : (
              content
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
