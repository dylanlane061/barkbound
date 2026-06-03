'use client';

import { useEffect, useState } from 'react';
import Photo from '@/components/kit/Photo';
import Icon from '@/components/kit/Icon';
import type { CoverTone } from '@/lib/trip-summary';

const TONES: { key: CoverTone; label: string }[] = [
  { key: 'green', label: 'Forest' },
  { key: 'sand', label: 'Desert' },
  { key: 'cool', label: 'Coast' },
  { key: 'rust', label: 'Canyon' },
  { key: 'alpine', label: 'Alpine' },
];

export type CreateTripInput = { name: string; region: string; when: string; tone: CoverTone };

export default function CreateTripModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: CreateTripInput) => Promise<void> | void;
}) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [when, setWhen] = useState('');
  const [tone, setTone] = useState<CoverTone>('green');
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const canSubmit = name.trim().length > 0 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), region: region.trim(), when: when.trim(), tone });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="scrim" onMouseDown={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: 520 }}
        role="dialog"
        aria-modal="true"
        aria-label="Create a trip"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="row between" style={{ padding: '20px 24px 0' }}>
          <div className="col g4">
            <span className="eyebrow">New adventure</span>
            <h2 className="display" style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>
              Create a trip
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: 4,
            }}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <div className="col g16 scroll" style={{ padding: 24 }}>
          <div>
            <label className="field-label" htmlFor="trip-name">
              Trip name
            </label>
            <input
              id="trip-name"
              className="input"
              autoFocus
              placeholder="Sedona Fall Road Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          </div>

          <div className="row g12">
            <div className="grow">
              <label className="field-label" htmlFor="trip-region">
                Region
              </label>
              <input
                id="trip-region"
                className="input"
                placeholder="Northern Arizona"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
            <div className="grow">
              <label className="field-label" htmlFor="trip-when">
                When
              </label>
              <input
                id="trip-when"
                className="input"
                placeholder="Sept 12–18"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
          </div>

          <div>
            <span className="field-label">Cover</span>
            <div className="row g10 wrap">
              {TONES.map((t) => {
                const on = t.key === tone;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTone(t.key)}
                    aria-pressed={on}
                    style={{
                      padding: 0,
                      border: on ? '2px solid var(--green-700)' : '2px solid transparent',
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: 'none',
                      position: 'relative',
                      lineHeight: 0,
                    }}
                    title={t.label}
                  >
                    <Photo h={48} w={68} tone={t.key} glyph="route" round={9} />
                    {on && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: 'var(--green-800)',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="check" size={12} color="#fff" stroke={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="row g10 between" style={{ padding: '16px 24px', borderTop: '1px solid var(--line)' }}>
          <button className="btn btn-quiet" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!canSubmit} onClick={submit}>
            {submitting ? 'Creating…' : 'Create trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
