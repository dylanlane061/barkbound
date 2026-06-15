'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Page from '@/components/kit/Page';
import Crumb from '@/components/kit/Crumb';
import Icon from '@/components/kit/Icon';
import { ScoreRing, Conf } from '@/components/kit/Score';
import Toast, { type ToastData } from '@/components/kit/Toast';
import { CATS } from '@/lib/design/cats';
import { CONF_LABEL, CONF_VAR } from '@/lib/design/confidence';
import { pluralize } from '@/lib/format';
import type { PlaceDetail } from '@/lib/place-detail';
import SaveButton from '@/components/trips/SaveButton';
import PlaceGallery from './PlaceGallery';
import EvidenceRow from './EvidenceRow';
import Spinner from '@/components/discover/Spinner';

export default function PlaceDetailClient({ data }: { data: PlaceDetail }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  // Once the server reports the place assessed, clear the local checking state.
  useEffect(() => {
    if (data.assessed && checking) setChecking(false);
  }, [data.assessed, checking]);

  const phase: 'unscored' | 'computing' | 'done' = checking
    ? 'computing'
    : data.assessed
      ? 'done'
      : 'unscored';

  async function runAssess(isRefresh: boolean) {
    setChecking(true);
    try {
      const res = await fetch(`/api/places/${data.id}/assess`, { method: 'POST' });
      if (!res.ok) throw new Error('assess failed');
      const r = (await res.json()) as { score: number };
      router.refresh();
      setToast(
        isRefresh
          ? { message: `Score refreshed — ${r.score} from public evidence`, icon: 'refresh' }
          : { message: `PawSignal scored ${data.name} ${r.score}`, icon: 'paw' },
      );
    } catch {
      setChecking(false);
      setToast({ message: 'Assessment failed — please try again.', icon: 'x' });
    }
  }

  async function saveTo(
    tripId: string,
    nodeId: string | null,
    tripName: string,
    stopLabel: string | null,
  ) {
    setSaved(true);
    const res = await fetch(`/api/trips/${tripId}/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: data.id, nodeId: nodeId ?? undefined }),
    });
    if (!res.ok) {
      setToast({ message: 'Could not save — please try again.', icon: 'x' });
      return;
    }
    setToast({
      message: `Saved${stopLabel ? ` to ${stopLabel}` : ''} · ${tripName}`,
      icon: 'check',
      action: { label: 'View trip', onClick: () => router.push(`/trips/${tripId}`) },
    });
  }

  const col = CONF_VAR[data.tier];

  return (
    <Page max={1180}>
      <Crumb items={data.breadcrumb} />
      <PlaceGallery category={data.category} label={data.category ? CATS[data.category].label : undefined} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 36, alignItems: 'start' }}>
        {/* main column */}
        <div>
          <div className="row g10 center" style={{ marginBottom: 6 }}>
            {data.category && <span className="eyebrow">{CATS[data.category].label}</span>}
            {(data.city || data.state) && (
              <>
                <span style={{ color: 'var(--line-2)' }}>·</span>
                <span className="row g6 center" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  <Icon name="pin" size={14} color="var(--muted)" />
                  {[data.city, data.state].filter(Boolean).join(', ')}
                </span>
              </>
            )}
          </div>
          <h1 className="display" style={{ fontWeight: 800, fontSize: 36, color: 'var(--green-900)', margin: '0 0 8px' }}>
            {data.name}
          </h1>
          {data.address && (
            <div className="mono" style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              {data.address}
            </div>
          )}

          {data.tags.length > 0 && (
            <div className="row g8 wrap" style={{ marginBottom: 28 }}>
              {data.tags.map((t) => (
                <span key={t} className="chip sand">
                  <Icon name="check" size={13} color={phase === 'done' && data.tier === 'hi' ? 'var(--hi)' : 'var(--muted)'} stroke={2.4} />
                  {t}
                </span>
              ))}
            </div>
          )}

          {phase === 'unscored' && (
            <div className="card" style={{ padding: 22 }}>
              <div className="row g12 center" style={{ marginBottom: 12 }}>
                <span
                  className="row center"
                  style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--green-tint-2)', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Icon name="paw" size={20} color="var(--green-700)" fill="var(--green-700)" stroke={0} />
                </span>
                <div>
                  <h2 className="display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--green-900)', margin: 0 }}>
                    Not assessed yet
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: '3px 0 0' }}>
                    Run PawSignal to gather public evidence and build a confidence score for this place.
                  </p>
                </div>
              </div>
              <button className="btn btn-orange" onClick={() => runAssess(false)}>
                <Icon name="paw" size={16} color="#fff" fill="#fff" stroke={0} />
                Request assessment
              </button>
            </div>
          )}

          {phase === 'computing' && (
            <div className="card row g12 center" style={{ padding: 22 }}>
              <Spinner size={20} />
              <div>
                <div className="display" style={{ fontWeight: 700, fontSize: 16, color: 'var(--green-900)' }}>
                  Running PawSignal…
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
                  Collecting and weighing public evidence near this place.
                </div>
              </div>
            </div>
          )}

          {phase === 'done' && (
            <>
              <div className="card" style={{ padding: '4px 22px 8px' }}>
                <div className="row between center" style={{ padding: '18px 0 12px', borderBottom: '1px solid var(--line)', marginBottom: 4 }}>
                  <div>
                    <div className="row g10 center">
                      <Icon name="shield" size={19} color="var(--green-700)" />
                      <h2 className="display" style={{ fontWeight: 700, fontSize: 19, color: 'var(--green-900)', margin: 0 }}>
                        How PawSignal reached {data.score}
                      </h2>
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '6px 0 0 29px' }}>
                      Open any source to read the exact evidence — never a black box.
                    </p>
                  </div>
                  <span className="label">{pluralize(data.sourcesCount, 'source')}</span>
                </div>
                {data.evidence.length > 0 ? (
                  data.evidence.map((e, i) => (
                    <EvidenceRow key={e.id} e={e} defaultOpen={i === 0} last={i === data.evidence.length - 1} />
                  ))
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--muted)', padding: '16px 0' }}>
                    We looked across our public sources and found little dog-specific evidence for this place yet.
                  </p>
                )}
              </div>
              <div className="row g8 center" style={{ marginTop: 14, fontSize: 12, color: 'var(--muted)' }}>
                <Icon name="clock" size={14} color="var(--muted)" />
                Score is an estimate from public evidence, not a guarantee. Always confirm directly before you visit.
              </div>
            </>
          )}
        </div>

        {/* side box */}
        <div style={{ position: 'sticky', top: 88 }}>
          {phase === 'done' ? (
            <div className="card col g16" style={{ padding: 22, alignItems: 'center' }}>
              <ScoreRing value={data.score} size={132} stroke={8} />
              <div className="col g4 center" style={{ alignItems: 'center' }}>
                <Conf level={data.tier} />
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {CONF_LABEL[data.tier]} confidence · {pluralize(data.sourcesCount, 'source')}
                </span>
              </div>
              <div className="col g8" style={{ width: '100%' }}>
                <SaveButton
                  targets={data.saveTargets}
                  saved={saved}
                  variant="primary"
                  label={saved ? 'Saved to trip' : 'Save to trip'}
                  onPick={saveTo}
                />
                <button className="btn btn-ghost" onClick={() => runAssess(true)} style={{ width: '100%' }}>
                  <Icon name="refresh" size={16} color="var(--green-800)" />
                  Refresh score
                </button>
              </div>
            </div>
          ) : (
            <div className="card col g16" style={{ padding: 22, alignItems: 'center', textAlign: 'center' }}>
              <span
                className="row center"
                style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-tint-2)', justifyContent: 'center', border: `2px dashed ${col}` }}
              >
                {phase === 'computing' ? (
                  <Spinner size={24} />
                ) : (
                  <Icon name="paw" size={28} color="var(--green-700)" fill="var(--green-700)" stroke={0} />
                )}
              </span>
              <div className="col g4" style={{ alignItems: 'center' }}>
                <span className="display" style={{ fontWeight: 700, fontSize: 17, color: 'var(--green-900)' }}>
                  {phase === 'computing' ? 'Assessing…' : 'No score yet'}
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {phase === 'computing'
                    ? 'PawSignal is gathering evidence.'
                    : 'Request an assessment to see a confidence score.'}
                </span>
              </div>
              <button
                className="btn btn-orange"
                style={{ width: '100%' }}
                onClick={() => runAssess(false)}
                disabled={phase === 'computing'}
              >
                {phase === 'computing' ? (
                  <>
                    <Spinner size={14} />
                    Checking…
                  </>
                ) : (
                  <>
                    <Icon name="paw" size={15} color="#fff" fill="#fff" stroke={0} />
                    Request assessment
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </Page>
  );
}
