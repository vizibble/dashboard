import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';

import { formatRelative, formatValue, thresholdColor } from '@/app/pages/dashboards/shared/lib/format';
import type { SummaryValue } from '@/app/pages/dashboards/shared/types';
import type { WidgetViewProps } from '@/app/pages/dashboards/shared/widgets/types';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

type PlacedValue = SummaryValue & { latitude: number; longitude: number };

function isPlaced(value: SummaryValue): value is PlacedValue {
  return typeof value.latitude === 'number' && typeof value.longitude === 'number';
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Devices placed at their latest latitude/longitude readings on OpenStreetMap.
 * Devices without a position are listed under the map instead of being guessed.
 */
export function MapWidget({ presentation, result }: WidgetViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mapRef = useRef<L.Map | null>(null);

  const layerRef = useRef<L.LayerGroup | null>(null);

  const fittedRef = useRef('');

  const placed = useMemo(() => result.values.filter(isPlaced), [result.values]);

  const unplaced = result.values.length - placed.length;

  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const map = L.map(ref.current, {
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer(TILE_URL, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
    map.setView([20, 0], 2);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    const observer = new ResizeObserver(() => map.invalidateSize());

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    const layer = layerRef.current;

    if (!map || !layer) {
      return;
    }
    layer.clearLayers();
    const bounds: L.LatLngTuple[] = [];

    for (const item of placed) {
      const position: L.LatLngTuple = [item.latitude, item.longitude];

      bounds.push(position);
      const numeric = typeof item.value === 'number' ? item.value : null;

      const color = thresholdColor(numeric, presentation.thresholds) ?? presentation.color ?? '#3fafd5';

      L.circleMarker(position, {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      })
        .bindPopup(
          `<strong>${escapeHtml(item.device_name ?? '')}</strong><br/>` +
            `${escapeHtml(result.metric?.label ?? '')}: ${escapeHtml(formatValue(item.value, result.metric, presentation))}<br/>` +
            `<span style="opacity:.7">${escapeHtml(formatRelative(item.t))}</span>`,
        )
        .addTo(layer);
    }
    // Only re-frame when the set of devices changes, so live refreshes keep the user's pan and zoom.
    const fitted = placed.map((item) => item.device_id).join(',');

    if (fitted === fittedRef.current) {
      return;
    }
    fittedRef.current = fitted;
    const [only] = bounds;

    if (bounds.length === 1 && only) {
      map.setView(only, 14);

      return;
    }
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
    }
  }, [placed, presentation, result.metric]);

  return (
    <div className="flex h-full flex-col gap-1.5">
      <div ref={ref} className="z-0 min-h-0 flex-1 overflow-hidden rounded-md border" />
      {unplaced > 0 && (
        <p className="text-muted-foreground text-xs">
          {unplaced} device{unplaced === 1 ? ' has' : 's have'} no position reported yet.
        </p>
      )}
    </div>
  );
}
