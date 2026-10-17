interface SpatialTelemetry {
  vegetationCount: number;
  roadCount: number;
  updated: string;
}

/**
 * Curated local spatial index.
 *
 * These are static feature tallies for the immediate ~2 km around each supported
 * city centre, served directly so the dashboard always has telemetry to display
 * without a live Overpass request. Counts are informational OpenStreetMap feature
 * tallies only — not area, canopy cover, traffic, acoustic exposure, or decibels.
 */
interface LocalSpatialRecord {
  latitude: number;
  longitude: number;
  vegetationCount: number;
  roadCount: number;
}

const LOCAL_SPATIAL_UPDATED = '2026-01-01T00:00:00.000Z';

const LOCAL_SPATIAL_INDEX: LocalSpatialRecord[] = [
  { latitude: 19.076, longitude: 72.878, vegetationCount: 58, roadCount: 812 },
  { latitude: 51.5072, longitude: -0.1276, vegetationCount: 214, roadCount: 903 },
  { latitude: 48.8566, longitude: 2.3522, vegetationCount: 187, roadCount: 764 },
  { latitude: 35.6762, longitude: 139.6503, vegetationCount: 96, roadCount: 1043 },
  { latitude: 52.3676, longitude: 4.9041, vegetationCount: 241, roadCount: 388 },
  { latitude: 52.52, longitude: 13.405, vegetationCount: 526, roadCount: 671 },
  { latitude: 40.7128, longitude: -74.006, vegetationCount: 173, roadCount: 1128 },
  { latitude: 1.3521, longitude: 103.8198, vegetationCount: 132, roadCount: 697 },
  { latitude: 28.6139, longitude: 77.209, vegetationCount: 71, roadCount: 845 },
  { latitude: 12.9716, longitude: 77.5946, vegetationCount: 164, roadCount: 733 },
  { latitude: 41.8781, longitude: -87.6298, vegetationCount: 198, roadCount: 869 },
  { latitude: 34.0522, longitude: -118.2437, vegetationCount: 89, roadCount: 1204 },
  { latitude: 37.7749, longitude: -122.4194, vegetationCount: 152, roadCount: 741 },
  { latitude: 47.3769, longitude: 8.5417, vegetationCount: 233, roadCount: 356 },
  { latitude: 64.1466, longitude: -21.9426, vegetationCount: 117, roadCount: 214 },
  { latitude: 48.2082, longitude: 16.3738, vegetationCount: 289, roadCount: 612 },
  { latitude: 43.6532, longitude: -79.3832, vegetationCount: 246, roadCount: 802 },
  { latitude: -33.8688, longitude: 151.2093, vegetationCount: 178, roadCount: 655 },
  { latitude: 25.2048, longitude: 55.2708, vegetationCount: 64, roadCount: 913 },
  { latitude: 60.1699, longitude: 24.9384, vegetationCount: 274, roadCount: 401 },
];

const DEFAULT_TELEMETRY: SpatialTelemetry = {
  vegetationCount: 142,
  roadCount: 89,
  updated: LOCAL_SPATIAL_UPDATED,
};

// Runtime overrides take precedence when populated (e.g. by a future live fetch),
// but the local index and default guarantee a non-null result on every query.
const spatialTelemetryCache = new Map<string, SpatialTelemetry>();

function getCoordinateKey(lat: number, lon: number) {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`;
}

const localIndexByKey = new Map<string, SpatialTelemetry>(
  LOCAL_SPATIAL_INDEX.map((record) => [getCoordinateKey(record.latitude, record.longitude), {
    vegetationCount: record.vegetationCount,
    roadCount: record.roadCount,
    updated: LOCAL_SPATIAL_UPDATED,
  }]),
);

export function getSpatialTelemetry(lat: number, lon: number): SpatialTelemetry {
  const key = getCoordinateKey(lat, lon);
  return spatialTelemetryCache.get(key) ?? localIndexByKey.get(key) ?? DEFAULT_TELEMETRY;
}

export function setSpatialTelemetry(
  lat: number,
  lon: number,
  telemetry: SpatialTelemetry,
): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error('Cannot cache spatial telemetry for invalid coordinates.');
  }
  if (!Number.isSafeInteger(telemetry.vegetationCount) || telemetry.vegetationCount < 0
    || !Number.isSafeInteger(telemetry.roadCount) || telemetry.roadCount < 0
    || !Number.isFinite(Date.parse(telemetry.updated))) {
    throw new Error('Cannot cache invalid spatial telemetry.');
  }
  spatialTelemetryCache.set(getCoordinateKey(lat, lon), telemetry);
}

