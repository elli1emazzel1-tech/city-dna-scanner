/**
 * CityScan STAC + AOI helpers.
 *
 * STAC search uses Element 84 Earth Search (keyless) to discover Sentinel-2 L2A
 * items for a city AOI. The scan route then reads selected items via
 * `src/lib/cityscan/scan.cjs` (`readScene`) and processes them via `runScan`.
 */

const STAC_ROOT = 'https://earth-search.aws.element84.com/v1';

interface StacItemProperties {
  datetime: string;
  platform?: string;
  'eo:cloud_cover'?: number;
  'grid:code'?: string;
  'proj:epsg'?: number;
  'processing:baseline'?: string;
  [key: string]: unknown;
}

export interface StacItem {
  id: string;
  type: 'Feature';
  properties: StacItemProperties;
  assets: Record<string, { href: string }>;
  geometry: unknown;
}

interface StacSearchResponse {
  type: 'FeatureCollection';
  features: StacItem[];
  context?: { matched: number; returned: number };
}

/**
 * Compute a fixed ~10 km × 10 km AOI square centred on the city coordinates,
 * matching the Phase 1 architecture decision. Returns a GeoJSON-style polygon
 * [[lon,lat],[lon,lat],...] suitable for scan.cjs `runScan(..., aoi)`.
 */
export function computeCityAoI(latitude: number, longitude: number): number[][] {
  const earthRadiusKm = 6371.0;
  const halfKm = 5.0;
  const halfLatDeg = (halfKm / earthRadiusKm) * (180 / Math.PI);
  const halfLonDeg =
    (halfKm / earthRadiusKm) * (180 / Math.PI) / Math.cos((latitude * Math.PI) / 180);

  const minLon = longitude - halfLonDeg;
  const maxLon = longitude + halfLonDeg;
  const minLat = latitude - halfLatDeg;
  const maxLat = latitude + halfLatDeg;

  return [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
    [minLon, minLat],
  ];
}

/**
 * Expected UTM EPSG code for a WGS84 coordinate (zone derived from longitude).
 * Lets the scan pipeline validate each city's raster CRS without hardcoding the
 * Phase 3 Amsterdam zone (EPSG:32631).
 */
export function expectedUtmEpsg(latitude: number, longitude: number): number {
  const zone = Math.floor((longitude + 180) / 6) + 1;
  const clamped = Math.min(Math.max(zone, 1), 60);
  return (latitude >= 0 ? 32600 : 32700) + clamped;
}

export interface StacSearchResult {
  /** Items passing the cloud gate, sorted newest-first, capped at `limit`. */
  items: StacItem[];
  /** Total scenes matched in the datetime window before the cloud gate. */
  matched: number;
}

/**
 * Search Earth Search STAC for Sentinel-2 L2A items in the AOI bbox.
 *
 * - `before` narrows the window to scenes older than that RFC3339 instant
 *   (open start via `../`, the only open-interval form Earth Search accepts;
 *   verified live — `null/` returns HTTP 400).
 * - Server-side `sortby` desc (verified live) with a defensive client-side
 *   re-sort; the cloud gate is applied client-side so callers can report
 *   "no scenes in window" separately from "all scenes too cloudy".
 */
export async function searchStacItems(
  bbox: [number, number, number, number],
  options: { cloudGatePct: number; before?: string; limit?: number } = { cloudGatePct: 20 },
): Promise<StacSearchResult> {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const { cloudGatePct, before, limit = 10 } = options;

  const datetime = before
    ? `../${before}`
    : `${new Date(Date.now() - 14 * 86_400_000).toISOString()}/${new Date().toISOString()}`;

  const body: Record<string, unknown> = {
    collections: ['sentinel-2-l2a'],
    bbox: [minLon, minLat, maxLon, maxLat],
    datetime,
    limit: 100,
    sortby: [{ field: 'properties.datetime', direction: 'desc' }],
  };

  const response = await fetch(`${STAC_ROOT}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`STAC search failed: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as StacSearchResponse;
  const features = payload.features ?? [];
  const items = features
    .filter((item) => {
      const cloud = item.properties['eo:cloud_cover'];
      return Number.isFinite(cloud) && (cloud as number) < cloudGatePct;
    })
    .sort((a, b) => Date.parse(b.properties.datetime) - Date.parse(a.properties.datetime))
    .slice(0, limit);

  return { items, matched: features.length };
}

/**
 * Fetch a single STAC item by ID.
 */
export async function fetchStacItem(itemId: string): Promise<StacItem> {
  const response = await fetch(
    `${STAC_ROOT}/collections/sentinel-2-l2a/items/${encodeURIComponent(itemId)}`,
    { signal: AbortSignal.timeout(30_000) },
  );
  if (!response.ok) {
    throw new Error(`STAC item ${itemId}: HTTP ${response.status}`);
  }
  const item = (await response.json()) as StacItem;
  if (!item || item.type !== 'Feature' || item.id !== itemId) {
    throw new Error(`STAC item ${itemId} has an invalid feature structure.`);
  }
  return item;
}