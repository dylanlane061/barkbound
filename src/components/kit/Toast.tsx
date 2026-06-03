'use client';

import { useEffect } from 'react';
import Icon, { type IconName } from './Icon';

export type ToastData = {
  message: string;
  icon?: IconName;
  /** Optional action shown on the right (e.g. "View trip"). */
  action?: { label: string; onClick: () => void };
};

// Bottom-center auto-dismissing toast. Green by default with a check icon.
export default function Toast({
  toast,
  onDismiss,
  duration = 3200,
}: {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [toast, duration, onDismiss]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 300,
        pointerEvents: 'none',
      }}
    >
      <div
        className="toast row g10"
        role="status"
        style={{
          pointerEvents: 'auto',
          background: 'var(--green-800)',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 'var(--r)',
          boxShadow: 'var(--sh-lg)',
          fontSize: 14,
          fontWeight: 500,
          maxWidth: 480,
        }}
      >
        <Icon name={toast.icon ?? 'check'} size={18} color="#fff" stroke={2.2} />
        <span>{toast.message}</span>
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              onDismiss();
            }}
            style={{
              marginLeft: 6,
              background: 'rgba(255,255,255,0.16)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 11px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
