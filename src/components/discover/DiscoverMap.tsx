'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/kit/Icon';
import TerrainMap from '@/components/kit/TerrainMap';
import { CONF_VAR } from '@/lib/design/confidence';
import type { DiscoverPlace } from '@/lib/discover';
import MapPin from './MapPin';
import type { LiveStatus } from './StatusRing';

const METERS_PER_MILE = 1609.344;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

type MarkerEntry = { id: string; container: HTMLDivElement };

export default function DiscoverMap({
  center,
  radiusMiles,
  locationLabel,
  places,
  statusOf,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  onClearSelection,
  peek,
}: {
  center: { lat: number; lon: number };
  radiusMiles: number;
  locationLabel: string;
  places: DiscoverPlace[];
  statusOf: (id: string) => LiveStatus;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  peek: React.ReactNode;
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const markersRef = useRef<Map<string, { marker: google.maps.marker.AdvancedMarkerElement; container: HTMLDivElement }>>(
    new Map(),
  );
  const markerLibRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(!API_KEY);
  const [entries, setEntries] = useState<MarkerEntry[]>([]);

  // Load the Maps JS API + create the map once.
  useEffect(() => {
    if (!API_KEY || !mapDivRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        // Imported dynamically (client-only): the loader touches `window` at
        // module load, which would crash server-side rendering.
        const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
        setOptions({ key: API_KEY, v: 'weekly' });
        const [maps, markerLib] = await Promise.all([
          importLibrary('maps') as Promise<google.maps.MapsLibrary>,
          importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
        ]);
        if (cancelled || !mapDivRef.current) return;
        const { Map } = maps;
        markerLibRef.current = markerLib.AdvancedMarkerElement;
        const map = new Map(mapDivRef.current, {
          center: { lat: center.lat, lng: center.lon },
          zoom: 11,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        map.addListener('click', () => onClearSelection());
        mapRef.current = map;
        circleRef.current = new google.maps.Circle({
          map,
          center: { lat: center.lat, lng: center.lon },
          radius: radiusMiles * METERS_PER_MILE,
          strokeColor: '#1f4d3a',
          strokeOpacity: 0.5,
          strokeWeight: 1.5,
          fillColor: '#1f4d3a',
          fillOpacity: 0.06,
          clickable: false,
        });
        setReady(true);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Create once; subsequent center/radius changes handled in their own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter + resize the radius circle when the location or radius changes.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const c = { lat: center.lat, lng: center.lon };
    mapRef.current.setCenter(c);
    if (circleRef.current) {
      circleRef.current.setCenter(c);
      circleRef.current.setRadius(radiusMiles * METERS_PER_MILE);
      const b = circleRef.current.getBounds();
      if (b) mapRef.current.fitBounds(b, 0);
    }
  }, [ready, center.lat, center.lon, radiusMiles]);

  // Reconcile markers with the current places list.
  useEffect(() => {
    if (!ready || !markerLibRef.current || !mapRef.current) return;
    const AdvancedMarker = markerLibRef.current;
    const existing = markersRef.current;
    const wanted = new Set(places.map((p) => p.id));

    // Remove stale markers.
    for (const [id, entry] of existing) {
      if (!wanted.has(id)) {
        entry.marker.map = null;
        existing.delete(id);
      }
    }
    // Add/position markers.
    for (const p of places) {
      const current = existing.get(p.id);
      if (current) {
        current.marker.position = { lat: p.latitude, lng: p.longitude };
      } else {
        const container = document.createElement('div');
        const marker = new AdvancedMarker({
          map: mapRef.current,
          position: { lat: p.latitude, lng: p.longitude },
          content: container,
        });
        existing.set(p.id, { marker, container });
      }
    }
    setEntries([...existing.entries()].map(([id, e]) => ({ id, container: e.container })));
  }, [ready, places]);

  // Cleanup all markers on unmount.
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      for (const [, e] of markers) e.marker.map = null;
      markers.clear();
    };
  }, []);

  const placeById = new Map(places.map((p) => [p.id, p]));

  const overlays = (
    <>
      <div
        className="row center g8"
        style={{
          position: 'absolute',
          left: 14,
          top: 14,
          background: 'var(--card)',
          borderRadius: 10,
          padding: '8px 12px',
          boxShadow: 'var(--sh)',
          zIndex: 5,
        }}
      >
        <Icon name="pin" size={15} color="var(--green-700)" />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
          {locationLabel} &amp; {radiusMiles} mi
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 14,
          bottom: 14,
          background: 'var(--card)',
          borderRadius: 11,
          padding: '9px 12px',
          boxShadow: 'var(--sh)',
          display: 'flex',
          gap: 14,
          zIndex: 5,
        }}
      >
        <span className="label" style={{ fontSize: 9.5 }}>
          Confidence
        </span>
        {(['hi', 'med', 'lo'] as const).map((k) => (
          <span key={k} className="row g6 center" style={{ fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: CONF_VAR[k] }} />
            {k === 'hi' ? 'High' : k === 'med' ? 'Medium' : 'Lower'}
          </span>
        ))}
      </div>
      {peek}
    </>
  );

  if (failed) {
    return (
      <TerrainMap h="100%" style={{ borderLeft: '1px solid var(--line)' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
            fontSize: 13,
            textAlign: 'center',
            padding: 24,
          }}
        >
          Interactive map needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
          <br />
          Showing the list view.
        </div>
        {overlays}
      </TerrainMap>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', borderLeft: '1px solid var(--line)' }}>
      <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />
      {/* React-rendered pin content portaled into each AdvancedMarker container */}
      {entries.map(({ id, container }) => {
        const p = placeById.get(id);
        if (!p) return null;
        const state = selectedId === id ? 'sel' : hoveredId === id ? 'hover' : 'idle';
        return createPortal(
          <MapPin
            place={p}
            status={statusOf(id)}
            state={state}
            onEnter={() => onHover(id)}
            onLeave={() => onHover(null)}
            onClick={() => onSelect(id)}
          />,
          container,
        );
      })}
      {overlays}
    </div>
  );
}
