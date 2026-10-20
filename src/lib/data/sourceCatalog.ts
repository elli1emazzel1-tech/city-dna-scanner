/**
 * Centralised data-source catalogue.
 *
 * Single registry of every external provider Enrealys actually connects to,
 * together with the official website and documentation URLs used by the
 * Data & Sources page and the dashboard indicator cards. Availability statuses
 * are derived from real provider responses for the selected city
 * (see resolveSourceStatus) — nothing here fabricates availability, timestamps
 * or update frequencies.
 */
import type { CityPopulation } from './population';
import type { CityEnvironmentalData, EnvironmentalMetric } from './types';

export type SourceId =
  | 'open-meteo-forecast'
  | 'open-meteo-air-quality'
  | 'open-meteo-flood'
  | 'open-meteo-historical'
  | 'open-meteo-geocoding'
  | 'world-bank-jmp'
  | 'wikidata'
  | 'openstreetmap'
  | 'natural-earth'
  | 'earth-search-sentinel2'
  | 'esri-world-imagery'
  | 'openweather';

export type SourceCategory =
  | 'Atmosphere'
  | 'Hydrosphere'
  | 'Land surface'
  | 'Socio-economic'
  | 'Earth observation'
  | 'Geospatial reference';

export type SourceDataKind = 'Observed' | 'Modelled' | 'Historical' | 'Cached' | 'Reference';

/** Availability derived from configuration plus, where available, the latest provider responses. */
export type SourceStatus = 'AVAILABLE' | 'CONFIGURED' | 'STATIC' | 'DEGRADED' | 'UNAVAILABLE';

export type SourceIntegration = 'live' | 'on-demand' | 'static' | 'unconfigured';

export interface DataSourceRecord {
  id: SourceId;
  /** Dataset or endpoint name as displayed in the UI. */
  name: string;
  /** Organisation operating the source. */
  provider: string;
  description: string;
  category: SourceCategory;
  /** Indicators this source supplies to Enrealys. */
  indicators: string[];
  coverage: string;
  dataKinds: SourceDataKind[];
  /** Documented refresh behaviour; phrased only from what the integration actually does. */
  refresh: string;
  websiteUrl: string;
  docsUrl: string;
  attribution: string;
  /** What the supplied measurements represent. */
  measurements: string;
  limitations: string;
  integration: SourceIntegration;
  /** Environmental metrics populated from this source (drives per-city status). */
  metricIds: EnvironmentalMetric['id'][];
  providesCurrentWeather?: boolean;
  providesPopulation?: boolean;
  unavailabilityReason?: string;
}

export const dataSources: DataSourceRecord[] = [
  {
    id: 'open-meteo-forecast',
    name: 'Open-Meteo Forecast API',
    provider: 'Open-Meteo',
    description:
      'Global multi-model weather interpolation serving the dashboard’s current city-centre conditions: temperature, apparent temperature, humidity, wind speed, weather condition and 0–7 cm soil moisture.',
    category: 'Atmosphere',
    indicators: ['Current weather', 'Heat overlay (apparent temperature)', 'Soil-moisture note on the river-discharge card'],
    coverage: 'Global; the model grid point returned must be within 35 km of the selected city centre or the value is rejected.',
    dataKinds: ['Modelled'],
    refresh: 'Current conditions at a 15-minute model interval; requested per city view.',
    websiteUrl: 'https://open-meteo.com/',
    docsUrl: 'https://open-meteo.com/en/docs',
    attribution: 'Open-Meteo.com Weather API (Zippenfenig 2023, doi:10.5281/zenodo.7970649). Data licensed CC BY 4.0; non-commercial use is free, commercial use requires a subscription.',
    measurements:
      'Instantaneous model analyses valid at the reported model time, evaluated at the grid cell nearest the city centre — not measurements taken inside the city.',
    limitations:
      'Model-derived grid values, not station observations. Values represent the model grid point (a few kilometres away at best), so street-level conditions can differ substantially.',
    integration: 'live',
    metricIds: [],
    providesCurrentWeather: true,
  },
  {
    id: 'open-meteo-air-quality',
    name: 'Open-Meteo Air Quality API',
    provider: 'Open-Meteo · Copernicus CAMS',
    description:
      'Copernicus Atmosphere Monitoring Service (CAMS) global atmospheric-composition model output served through Open-Meteo: consolidated US AQI, PM₂.₅, PM₁₀, NO₂, O₃, SO₂ and carbon monoxide.',
    category: 'Atmosphere',
    indicators: ['Air quality (US AQI)', 'Carbon monoxide (CO)', 'Air-quality map overlay'],
    coverage: 'Global CAMS grid (~11 km); the returned grid point must be within 35 km of the selected city centre.',
    dataKinds: ['Modelled'],
    refresh: 'Current conditions at a 1-hour model interval; requested per city view.',
    websiteUrl: 'https://open-meteo.com/',
    docsUrl: 'https://open-meteo.com/en/docs/air-quality-api',
    attribution: 'Contains modified Copernicus Atmosphere Monitoring Service (CAMS) data, served by Open-Meteo. CAMS ENSEMBLE attribution plus an Open-Meteo reference is required for all users.',
    measurements:
      'Hourly modelled pollutant concentrations (µg/m³) and the consolidated US AQI computed by the provider for the same model time and grid point.',
    limitations:
      'Modelled concentrations, not regulatory station measurements. The reported CO field is carbon monoxide — not CO₂, greenhouse-gas emissions or grid carbon intensity. A single hourly value cannot support pollutant-specific AQI classifications.',
    integration: 'live',
    metricIds: ['air', 'carbon'],
  },
  {
    id: 'open-meteo-flood',
    name: 'Open-Meteo Flood API',
    provider: 'Open-Meteo · Copernicus GLOFAS',
    description:
      'Daily river-discharge estimates from the Copernicus Global Flood Awareness System (GloFAS v4) for the nearest river model cell to the selected city.',
    category: 'Hydrosphere',
    indicators: ['River discharge (m³/s)', 'Flood-risk map overlay'],
    coverage: 'Global river network on a ~0.05° (~5 km) grid; the selected river cell must be within 20 km of the city coordinates.',
    dataKinds: ['Modelled'],
    refresh: 'Daily model date (UTC); requested with 2 past days and 3 forecast days.',
    websiteUrl: 'https://open-meteo.com/',
    docsUrl: 'https://open-meteo.com/en/docs/flood-api',
    attribution: 'Copernicus Global Flood Awareness System (GloFAS), via Open-Meteo. Free non-commercial tier; commercial use requires a subscription.',
    measurements:
      'Mean daily river discharge (m³/s) simulated by GloFAS for the nearest river cell on the current UTC model date.',
    limitations:
      'Modelled discharge, not observed flow, urban runoff or a municipal flood-risk score. At ~5 km resolution the nearest river in the model may not be the river closest to the city centre.',
    integration: 'live',
    metricIds: ['flood'],
  },
  {
    id: 'open-meteo-historical',
    name: 'Open-Meteo Historical Weather API',
    provider: 'Open-Meteo · ECMWF ERA5',
    description:
      'Gap-free ERA5 reanalysis daily mean temperature backing the historical temperature chart on the overview dashboard.',
    category: 'Atmosphere',
    indicators: ['Daily mean temperature (historical chart)'],
    coverage: 'Global reanalysis on a 0.25° grid, available from 1940.',
    dataKinds: ['Historical'],
    refresh: 'Fetched on demand per chart view; the requested window ends five days before the current date.',
    websiteUrl: 'https://open-meteo.com/',
    docsUrl: 'https://open-meteo.com/en/docs/historical-weather-api',
    attribution: 'ERA5 from ECMWF, via Open-Meteo. Generated using Copernicus Climate Change Service information; CC BY 4.0 data licence with attribution.',
    measurements:
      'Daily mean 2 m air temperature (°C) reconstructed by the ERA5 reanalysis for the requested date window.',
    limitations:
      'Reanalysis is a model reconstruction of past weather, not a station observation. The archive lags real time, so the window always ends a few days before the present.',
    integration: 'on-demand',
    metricIds: [],
  },
  {
    id: 'open-meteo-geocoding',
    name: 'Open-Meteo Geocoding API',
    provider: 'Open-Meteo (GeoNames)',
    description:
      'Place-name search behind the dashboard city picker; resolves search terms to coordinates, country names and ISO country codes.',
    category: 'Geospatial reference',
    indicators: ['City search / geocoding'],
    coverage: 'Global place-name catalogue derived from GeoNames.',
    dataKinds: ['Reference'],
    refresh: 'Requested on demand for each city search query.',
    websiteUrl: 'https://open-meteo.com/',
    docsUrl: 'https://open-meteo.com/en/docs/geocoding-api',
    attribution: 'Location data based on GeoNames (CC BY 4.0), served by Open-Meteo.',
    measurements: 'Place name, country, ISO country code and WGS84 coordinates of the matched settlement centroid.',
    limitations:
      'Geocoded points are settlement centroids, not municipal boundaries; result quality depends on the underlying GeoNames catalogue.',
    integration: 'on-demand',
    metricIds: [],
  },
  {
    id: 'world-bank-jmp',
    name: 'World Bank · WHO/UNICEF JMP',
    provider: 'World Bank Open Data (source: WHO/UNICEF Joint Monitoring Programme)',
    description:
      'National safely-managed drinking-water coverage (indicator SH.H2O.SMDW.ZS), compiled from national household surveys by the WHO/UNICEF Joint Monitoring Programme and published through the World Bank API.',
    category: 'Socio-economic',
    indicators: ['National drinking-water coverage (% of population)'],
    coverage: 'Country level, keyed by ISO alpha-2 code; the latest reported year is used per country.',
    dataKinds: ['Historical'],
    refresh: 'Annual national estimates; the app caches each country’s latest value for 24 hours.',
    websiteUrl: 'https://washdata.org/',
    docsUrl: 'https://data.worldbank.org/indicator/SH.H2O.SMDW.ZS',
    attribution: 'World Bank Open Data (CC BY 4.0). Underlying estimates © WHO and UNICEF, WHO/UNICEF Joint Monitoring Programme.',
    measurements:
      'Percentage of the national population using drinking water from an improved source that is accessible on premises, available when needed and free from faecal and priority chemical contamination.',
    limitations:
      'A wide annual national estimate — not a city or municipal measurement, not water quality, and not a regulatory compliance assessment. Country-level statistics must never be read as local municipal figures.',
    integration: 'live',
    metricIds: ['water'],
  },
  {
    id: 'wikidata',
    name: 'Wikidata',
    provider: 'Wikimedia Foundation (community-maintained)',
    description:
      'Free knowledge base used to resolve a city-proper population figure (property P1082) together with its reference year and a link to the exact claim.',
    category: 'Socio-economic',
    indicators: ['City population (city proper, P1082)'],
    coverage: 'Global; restricted to qualifying settlement entities (city, capital city, town, metropolis, French commune).',
    dataKinds: ['Reference'],
    refresh: 'Continuous community edits; each city resolution is cached for 24 hours (failed lookups for 5 minutes).',
    websiteUrl: 'https://www.wikidata.org/',
    docsUrl: 'https://www.wikidata.org/wiki/Wikidata:Introduction',
    attribution: 'Structured data © Wikidata contributors, released under CC0 (public domain).',
    measurements: 'The latest qualifying population claim (P1082) of the matched settlement entity, with its reference year.',
    limitations:
      'Community-maintained data with variable completeness and vintage. Metropolitan-area and municipality figures are deliberately excluded, so some cities show no figure rather than an incorrect one.',
    integration: 'live',
    metricIds: [],
    providesPopulation: true,
  },
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    provider: 'OpenStreetMap Foundation & contributor community',
    description:
      'Community-mapped feature tallies within ~2 km of each catalogued city centre (served from the app’s cached local spatial index) plus OpenStreetMap raster basemap tiles on the interactive city map.',
    category: 'Land surface',
    indicators: ['Mapped vegetation features', 'Mapped road & rail features', 'City-map basemap tiles'],
    coverage: '20 catalogued city centres plus a documented default tally; 2 km radius; basemap tiles are global.',
    dataKinds: ['Cached'],
    refresh: 'Static cached snapshot dated 2026-01-01 — not a live Overpass query. Basemap tiles are streamed on demand.',
    websiteUrl: 'https://www.openstreetmap.org/',
    docsUrl: 'https://www.openstreetmap.org/copyright',
    attribution: '© OpenStreetMap contributors, licensed under the Open Data Commons Open Database License (ODbL). Attribution displayed on the city map.',
    measurements:
      'Counts of mapped vegetation features and highway/railway ways near the city centre, plus streamed basemap tiles.',
    limitations:
      'Feature counts are an inventory proxy — not green area, canopy cover, road length, traffic, acoustic exposure or decibels. Coverage varies with community mapping activity.',
    integration: 'live',
    metricIds: ['green', 'noise'],
  },
  {
    id: 'natural-earth',
    name: 'Natural Earth',
    provider: 'Natural Earth',
    description:
      '1:110m land polygons rendered once into the locally bundled equirectangular world map (public/world-land.svg) shown in the overview hero panel.',
    category: 'Geospatial reference',
    indicators: ['World-map land outlines (hero map)'],
    coverage: 'Global land outlines generalised to 1:110m scale.',
    dataKinds: ['Reference'],
    refresh: 'Static bundled asset — no runtime network request.',
    websiteUrl: 'https://www.naturalearthdata.com/',
    docsUrl: 'https://www.naturalearthdata.com/downloads/110m-physical-vectors/',
    attribution: 'Natural Earth vector data is public domain; no permission or credit is required ("Made with Natural Earth").',
    measurements: 'Generalised land polygons in an equirectangular projection used purely for city-position orientation.',
    limitations:
      'Highly generalised 1:110m outlines — suitable for continental-scale orientation only, never for boundary, area or proximity analysis.',
    integration: 'static',
    metricIds: [],
  },
  {
    id: 'earth-search-sentinel2',
    name: 'Element 84 Earth Search · Sentinel-2 L2A',
    provider: 'Element 84 (Copernicus Sentinel-2 data)',
    description:
      'Keyless STAC catalogue used by CityScan to discover Sentinel-2 Level-2A scenes over a fixed ~10 × 10 km city area of interest and drive before/after surface-change findings.',
    category: 'Earth observation',
    indicators: ['CityScan satellite observations & change findings'],
    coverage: 'Global Sentinel-2 coverage; CityScan scans a ~10 × 10 km area of interest per city.',
    dataKinds: ['Observed'],
    refresh: 'On demand per CityScan run; scenes are gated to <20 % cloud cover by default.',
    websiteUrl: 'https://earth-search.aws.element84.com/v1',
    docsUrl: 'https://dataspace.copernicus.eu/',
    attribution: 'Contains modified Copernicus data (Sentinel-2), indexed and served by Element 84 Earth Search. Copernicus data is free and open.',
    measurements:
      'Surface-reflectance imagery (Level-2A) with acquisition time, MGRS tile and cloud-cover metadata per scene.',
    limitations:
      'Optical imagery: clouds and seasonal phenology dominate short-term change. CityScan rejects pairs straddling processing-baseline changes and labels cross-season pairs.',
    integration: 'on-demand',
    metricIds: [],
  },
  {
    id: 'esri-world-imagery',
    name: 'Esri World Imagery',
    provider: 'Esri',
    description: 'Optional satellite-imagery basemap layer available as a toggle on the interactive city map.',
    category: 'Geospatial reference',
    indicators: ['Satellite basemap layer (city map toggle)'],
    coverage: 'Global imagery mosaic; ground resolution varies by location.',
    dataKinds: ['Observed'],
    refresh: 'Tile service; imagery capture dates vary per tile and are not surfaced in the UI.',
    websiteUrl: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
    docsUrl: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community. Attribution displayed on the city map.',
    measurements: 'Raster basemap tiles for visual context only; Enrealys derives no indicator values from this layer.',
    limitations: 'Imagery dates differ across the mosaic, so the layer cannot be used as a consistent time reference.',
    integration: 'on-demand',
    metricIds: [],
  },
  {
    id: 'openweather',
    name: 'OpenWeather Air Pollution API',
    provider: 'OpenWeather',
    description:
      'Legacy alternative air-quality lookup wired to /api/openweather/air-quality. The route exists but requires a server-side OPENWEATHER_API_KEY to function.',
    category: 'Atmosphere',
    indicators: ['Reported AQI (legacy lookup — inactive)'],
    coverage: 'Global when configured.',
    dataKinds: ['Modelled'],
    refresh: 'Not applicable while the integration is unconfigured.',
    websiteUrl: 'https://openweathermap.org/api',
    docsUrl: 'https://openweathermap.org/api',
    attribution: '© OpenWeather terms of service apply.',
    measurements: 'Would return a reported AQI value; no OpenWeather value is ever shown while the key is missing.',
    limitations:
      'Not available in this deployment: the server API key is not configured, so the route returns HTTP 503 and no OpenWeather data reaches the dashboard.',
    integration: 'unconfigured',
    metricIds: [],
    unavailabilityReason: 'OPENWEATHER_API_KEY is not set on the server, so the integration responds with HTTP 503.',
  },
];

export function getDataSource(id: SourceId): DataSourceRecord {
  const source = dataSources.find((item) => item.id === id);
  if (!source) throw new Error(`Unknown data source: ${id}`);
  return source;
}

const primarySourceByMetric: Record<EnvironmentalMetric['id'], SourceId> = {
  air: 'open-meteo-air-quality',
  carbon: 'open-meteo-air-quality',
  flood: 'open-meteo-flood',
  water: 'world-bank-jmp',
  green: 'openstreetmap',
  noise: 'openstreetmap',
};

/** Primary registry entry behind an environmental metric, used for dashboard source links. */
export function getPrimarySourceForMetric(metricId: EnvironmentalMetric['id']): DataSourceRecord {
  return getDataSource(primarySourceByMetric[metricId]);
}

export interface SourceStatusContext {
  data: CityEnvironmentalData;
  /** Resolved Wikidata population for the selected city; undefined while the lookup is pending. */
  population: CityPopulation | null | undefined;
}

export interface ResolvedSourceStatus {
  status: SourceStatus;
  /** Short, honest explanation of the derived status for the selected city. */
  detail: string;
  /** Latest provider-reported timestamp or period for the selected city, where one exists. */
  latest: string | null;
}

/** Derive a source's availability from configuration plus the latest real provider responses. */
export function resolveSourceStatus(source: DataSourceRecord, ctx: SourceStatusContext): ResolvedSourceStatus {
  if (source.integration === 'unconfigured') {
    return {
      status: 'UNAVAILABLE',
      detail: source.unavailabilityReason ?? 'This integration is not configured in the current deployment.',
      latest: null,
    };
  }
  if (source.integration === 'static') {
    return {
      status: 'STATIC',
      detail: 'Bundled with the application and served without a network request.',
      latest: null,
    };
  }
  if (source.providesCurrentWeather) {
    const { weather, city } = ctx.data;
    if (weather.status === 'ERROR') {
      return { status: 'DEGRADED', detail: 'The latest weather request for the selected city failed.', latest: null };
    }
    if (weather.status === 'UNAVAILABLE') {
      return { status: 'UNAVAILABLE', detail: `No current weather value is available for ${city.name}.`, latest: null };
    }
    return {
      status: 'AVAILABLE',
      detail: `Returned valid current conditions for ${city.name} on the latest load.`,
      latest: weather.updated,
    };
  }
  if (source.providesPopulation) {
    if (ctx.population === undefined) {
      return { status: 'CONFIGURED', detail: 'Resolving a city-proper population figure for the selected city…', latest: null };
    }
    if (ctx.population === null) {
      return {
        status: 'UNAVAILABLE',
        detail: `No qualifying city-proper population figure exists for ${ctx.data.city.name}; no metro or municipality value is substituted.`,
        latest: null,
      };
    }
    return {
      status: 'AVAILABLE',
      detail: `Resolved a city-proper population claim (P1082) for ${ctx.population.entityLabel}.`,
      latest: ctx.population.year === null ? null : String(ctx.population.year),
    };
  }
  if (source.metricIds.length > 0) {
    const dependents = ctx.data.metrics.filter((metric) => source.metricIds.includes(metric.id));
    if (dependents.length > 0) {
      const available = dependents.filter((metric) => metric.status !== 'ERROR' && metric.status !== 'UNAVAILABLE');
      if (available.length > 0) {
        const latest = available.map((metric) => metric.updated).find((value): value is string => value !== null) ?? null;
        return { status: 'AVAILABLE', detail: `Returned valid data for ${ctx.data.city.name} on the latest load.`, latest };
      }
      if (dependents.every((metric) => metric.status === 'ERROR')) {
        return {
          status: 'DEGRADED',
          detail: `The latest request for ${ctx.data.city.name} failed; the integration remains configured.`,
          latest: null,
        };
      }
      return {
        status: 'UNAVAILABLE',
        detail: `No ${source.name} value was returned for ${ctx.data.city.name}.`,
        latest: null,
      };
    }
  }
  return { status: 'CONFIGURED', detail: 'On-demand integration; not health-checked on this page.', latest: null };
}

/** Count a source as currently available unless it is degraded or unavailable for the selected city. */
export function isSourceAvailable(status: SourceStatus): boolean {
  return status === 'AVAILABLE' || status === 'CONFIGURED' || status === 'STATIC';
}

const LEADING_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}(?::\d{2})?))?/;

function parseProviderTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = LEADING_TIMESTAMP.exec(value);
  if (!match) return null;
  const parsed = Date.parse(`${match[1]}T${match[2] ?? '00:00'}`);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Most recent provider-reported timestamp for the selected city across the
 * current weather value and every successfully loaded metric. Returns the raw
 * provider string (never a synthesised value), or null when nothing parses.
 */
export function latestProviderTimestamp(data: CityEnvironmentalData): string | null {
  const candidates: (string | null)[] = [
    data.weather.status === 'ERROR' || data.weather.status === 'UNAVAILABLE' ? null : data.weather.updated,
    ...data.metrics
      .filter((metric) => metric.status !== 'ERROR' && metric.status !== 'UNAVAILABLE')
      .map((metric) => metric.updated),
  ];
  let best: { raw: string; parsed: number } | null = null;
  for (const raw of candidates) {
    if (raw === null) continue;
    const parsed = parseProviderTimestamp(raw);
    if (parsed === null) continue;
    if (!best || parsed > best.parsed) best = { raw, parsed };
  }
  return best?.raw ?? null;
}

/** One dashboard indicator mapped to its original data source. */
export interface CatalogueRow {
  indicator: string;
  sourceId: SourceId;
  dataType: string;
  metricId?: EnvironmentalMetric['id'];
  usesWeather?: boolean;
  usesPopulation?: boolean;
  /** Fallback "latest update" text for rows without a live per-city timestamp. */
  staticLatest?: string;
}

export const CATALOGUE_ROWS: CatalogueRow[] = [
  { indicator: 'Current weather', sourceId: 'open-meteo-forecast', dataType: 'Modelled · near-real-time', usesWeather: true },
  { indicator: 'Air quality (US AQI)', sourceId: 'open-meteo-air-quality', dataType: 'Modelled · near-real-time', metricId: 'air' },
  { indicator: 'Carbon monoxide (CO)', sourceId: 'open-meteo-air-quality', dataType: 'Modelled · near-real-time', metricId: 'carbon' },
  { indicator: 'River discharge', sourceId: 'open-meteo-flood', dataType: 'Modelled · daily', metricId: 'flood' },
  { indicator: 'Drinking-water coverage', sourceId: 'world-bank-jmp', dataType: 'Historical · national annual', metricId: 'water' },
  { indicator: 'Mapped vegetation features', sourceId: 'openstreetmap', dataType: 'Cached · static snapshot', metricId: 'green' },
  { indicator: 'Mapped road & rail features', sourceId: 'openstreetmap', dataType: 'Cached · static snapshot', metricId: 'noise' },
  { indicator: 'Historical temperature', sourceId: 'open-meteo-historical', dataType: 'Historical · reanalysis', staticLatest: 'On demand; window ends 5 days before today' },
  { indicator: 'City population', sourceId: 'wikidata', dataType: 'Reference · community-maintained', usesPopulation: true },
  { indicator: 'City search (geocoding)', sourceId: 'open-meteo-geocoding', dataType: 'Reference · on demand', staticLatest: 'On demand per search' },
  { indicator: 'World-map outlines', sourceId: 'natural-earth', dataType: 'Static reference', staticLatest: 'Bundled with the application' },
  { indicator: 'Satellite change scan', sourceId: 'earth-search-sentinel2', dataType: 'Observed · per scan', staticLatest: 'Per CityScan run (scenes <20 % cloud)' },
  { indicator: 'Satellite basemap', sourceId: 'esri-world-imagery', dataType: 'Observed · tile service', staticLatest: 'Per imagery tile' },
];

export function resolveCatalogueRow(
  row: CatalogueRow,
  ctx: SourceStatusContext,
): { latest: string; status: SourceStatus } {
  const resolved = resolveSourceStatus(getDataSource(row.sourceId), ctx);
  if (row.usesWeather) {
    return { latest: ctx.data.weather.updated ?? '—', status: resolved.status };
  }
  if (row.usesPopulation) {
    const latest = ctx.population === null || ctx.population === undefined || ctx.population.year === null
      ? '—'
      : String(ctx.population.year);
    return { latest, status: resolved.status };
  }
  if (row.metricId) {
    return { latest: ctx.data.metrics.find((metric) => metric.id === row.metricId)?.updated ?? '—', status: resolved.status };
  }
  return { latest: row.staticLatest ?? '—', status: resolved.status };
}
