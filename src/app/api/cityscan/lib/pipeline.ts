/**
 * CityScan scan pipeline — shared execution logic for POST /api/cityscan/scan
 * (member session or cron secret) and POST /api/cityscan/cron (Vercel cron).
 *
 * Runs the verified Phase 3 detection (src/lib/cityscan/scan.cjs `runScan`)
 * for one city and persists observations/finding when a Supabase client and
 * actor identity are supplied; compute-only contexts (cron without
 * service-role env) return the same payload with `persisted: false`.
 *
 * Never fabricates: attempts that never identified a STAC item are stored with
 * NULL observation metadata (migration Phase 4B amendment); rejection reasons
 * are preserved; `metrics` is null unless the 70% quorum was met.
 */

import { createRequire } from 'node:module';
import type { SupabaseClient } from '@supabase/supabase-js';

import { cities } from '@/lib/data/cities';
import {
  computeCityAoI,
  expectedUtmEpsg,
  fetchStacItem,
  searchStacItems,
  type StacItem,
} from './stac';
import type { ScanMetrics, ScanResult } from './types';

const require = createRequire(import.meta.url);
// Resolved from src/app/api/cityscan/lib → src/lib/cityscan/scan.cjs (4 levels up).
const { runScan, readScene } = require('../../../../lib/cityscan/scan.cjs');

const CLOUD_GATE_PCT = Number(process.env.CITYSCAN_CLOUD_GATE_PCT ?? 20);
const DEFAULT_QUORUM_PCT = 70;
/** Extended lookback (days) used when the default 14-day window yields no pair. */
const RETRY_LOOKBACK_DAYS = Number(process.env.CITYSCAN_RETRY_LOOKBACK_DAYS ?? 120);

export interface ScanActor {
  userId: string;
  orgId: string;
}

export interface ExecuteScanContext {
  actor: ScanActor | null;
  supabase: SupabaseClient | null;
  source: 'manual' | 'cron';
}

export interface ExecuteScanParams {
  cityId: string;
  beforeId?: string;
  afterId?: string;
}

export type CityScanStatus =
  | 'ACCEPTED'
  | 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS'
  | 'NO_CLEAR_OBSERVATION'
  | 'FAILED';

export interface CityScanResponse {
  status: CityScanStatus;
  cityId: string;
  persisted: boolean;
  observationId: string | null;
  beforeObservationId: string | null;
  afterObservationId: string | null;
  findingId: string | null;
  itemIds: (string | null)[];
  dates: { before: string | null; after: string | null };
  tile: string | null;
  epsg: number | null;
  totalAoiPixels: number | null;
  commonValidPixels: number | null;
  commonValidPct: number | null;
  quorumRequiredPct: number;
  rejectionReason: string | null;
  metrics: ScanMetrics | null;
  /** How many days back STAC discovery searched (14 default, 120 on retry). */
  discoveryWindowDays: number;
  /** Scenes matched in the window before the cloud gate (0 when the window was empty). */
  discoveryMatched: number;
  /** Cloud-cover % of the chosen before/after scenes (null when none chosen). */
  cloudCoverPctBefore: number | null;
  cloudCoverPctAfter: number | null;
  /** Processing baselines of the chosen scenes (null when none chosen). */
  baselineBefore: string | null;
  baselineAfter: string | null;
}

type Platform = 'sentinel-2a' | 'sentinel-2b' | 'sentinel-2c';

type ObservationStatus = 'accepted' | 'rejected_quorum' | 'no_clear_observation' | 'failed';

interface StacMeta {
  itemId: string;
  acquiredAt: string;
  platform: Platform;
  tile: string;
  processingBaseline: string;
  cloudCoverPct: number;
  epsg: number | null;
  bandAssets: Record<string, string>;
}

function buildResponse(init: {
  status: CityScanStatus;
  cityId: string;
  persisted: boolean;
  rejectionReason: string | null;
  observationId?: string | null;
  beforeObservationId?: string | null;
  afterObservationId?: string | null;
  findingId?: string | null;
  itemIds?: (string | null)[];
  dates?: { before: string | null; after: string | null };
  tile?: string | null;
  epsg?: number | null;
  totalAoiPixels?: number | null;
  commonValidPixels?: number | null;
  commonValidPct?: number | null;
  quorumRequiredPct?: number;
  metrics?: ScanMetrics | null;
  discoveryWindowDays?: number;
  discoveryMatched?: number;
  cloudCoverPctBefore?: number | null;
  cloudCoverPctAfter?: number | null;
  baselineBefore?: string | null;
  baselineAfter?: string | null;
}): CityScanResponse {
  return {
    status: init.status,
    cityId: init.cityId,
    persisted: init.persisted,
    observationId: init.observationId ?? null,
    beforeObservationId: init.beforeObservationId ?? null,
    afterObservationId: init.afterObservationId ?? null,
    findingId: init.findingId ?? null,
    itemIds: init.itemIds ?? [null, null],
    dates: init.dates ?? { before: null, after: null },
    tile: init.tile ?? null,
    epsg: init.epsg ?? null,
    totalAoiPixels: init.totalAoiPixels ?? null,
    commonValidPixels: init.commonValidPixels ?? null,
    commonValidPct: init.commonValidPct ?? null,
    quorumRequiredPct: init.quorumRequiredPct ?? DEFAULT_QUORUM_PCT,
    rejectionReason: init.rejectionReason,
    metrics: init.metrics ?? null,
    discoveryWindowDays: init.discoveryWindowDays ?? RETRY_LOOKBACK_DAYS,
    discoveryMatched: init.discoveryMatched ?? 0,
    cloudCoverPctBefore: init.cloudCoverPctBefore ?? null,
    cloudCoverPctAfter: init.cloudCoverPctAfter ?? null,
    baselineBefore: init.baselineBefore ?? null,
    baselineAfter: init.baselineAfter ?? null,
  };
}

/** Namespaced synthetic key for attempt rows that have no STAC item. */
function attemptItemId(): string {
  return `attempt-${new Date().toISOString().replace(/[-:.]/g, '')}`;
}

/**
 * User-facing failure reason: first line only, absolute paths redacted,
 * capped at 280 chars. The full message stays in server logs; the UI only
 * ever sees this sanitised string (never credentials or stack traces).
 */
function sanitizeFailureMessage(message: string): string {
  const firstLine = message.split(/\r?\n/)[0] ?? message;
  const noPaths = firstLine
    .replace(/[A-Za-z]:\\[^\s'"]*/g, '[path]')
    .replace(/\/[^\s'"]*city-dna[^\s'"]*/gi, '[path]');
  const compact = noPaths.replace(/\s+/g, ' ').trim();
  if (!compact) return 'Scan failed unexpectedly.';
  return compact.length <= 280 ? compact : `${compact.slice(0, 277)}...`;
}

function resolvePlatform(raw: unknown, itemId: string): Platform {
  const normalized = String(raw ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const code of ['a', 'b', 'c'] as const) {
    if (normalized === `sentinel2${code}`) return `sentinel-2${code}`;
  }
  const idMatch = /^s2([abc])_/i.exec(itemId);
  if (idMatch) return `sentinel-2${idMatch[1].toLowerCase() as 'a' | 'b' | 'c'}`;
  throw new Error(`Cannot determine platform for ${itemId} (STAC platform: ${String(raw)}).`);
}

function extractStacMeta(item: StacItem): StacMeta {
  const properties = item.properties ?? {};
  const datetime = String(properties.datetime ?? '');
  if (!Number.isFinite(Date.parse(datetime))) {
    throw new Error(`STAC item ${item.id} has no valid acquisition datetime.`);
  }
  const cloud = properties['eo:cloud_cover'];
  if (!Number.isFinite(cloud)) {
    throw new Error(`STAC item ${item.id} has no valid eo:cloud_cover.`);
  }
  const rawEpsg = properties['proj:epsg'];
  const bandAssets: Record<string, string> = {};
  for (const [key, asset] of Object.entries(item.assets ?? {})) {
    if (asset?.href) bandAssets[key] = asset.href;
  }
  return {
    itemId: String(item.id),
    acquiredAt: datetime,
    platform: resolvePlatform(properties.platform, String(item.id)),
    tile: String(properties['grid:code'] ?? 'unknown'),
    processingBaseline: String(
      properties['s2:processing_baseline'] ?? properties['processing:baseline'] ?? 'unknown',
    ),
    cloudCoverPct: cloud as number,
    epsg: Number.isFinite(rawEpsg) ? Number(rawEpsg) : null,
    bandAssets,
  };
}

interface ObservationInput {
  itemId: string;
  meta: StacMeta | null;
  status: ObservationStatus;
  rejectionReason: string | null;
  totalAoiPixels: number;
  commonValidPct: number | null;
  validPixels?: number | null;
}

/**
 * Upsert one observation row (conflict target = unique org+city+item, so
 * cron re-runs refresh status/metrics instead of duplicating). Returns the
 * row id, or null when persistence is disabled (compute-only context) or the
 * write failed (logged, never thrown — one failed write must not lose the
 * computed result).
 */
async function persistObservation(
  supabase: SupabaseClient,
  actor: ScanActor,
  cityId: string,
  input: ObservationInput,
  source: 'manual' | 'cron',
): Promise<string | null> {
  const { data, error } = await supabase
    .from('cityscan_observations')
    .upsert(
      {
        org_id: actor.orgId,
        city_id: cityId,
        item_id: input.itemId,
        acquired_at: input.meta?.acquiredAt ?? null,
        platform: input.meta?.platform ?? null,
        tile: input.meta?.tile ?? null,
        processing_baseline: input.meta?.processingBaseline ?? null,
        cloud_cover_pct: input.meta?.cloudCoverPct ?? null,
        epsg: input.meta?.epsg ?? null,
        band_assets: input.meta?.bandAssets ?? {},
        window_pixels: {},
        valid_pixels: input.validPixels ?? null,
        total_aoi_pixels: input.totalAoiPixels,
        common_valid_pct: input.commonValidPct,
        status: input.status,
        rejection_reason: input.rejectionReason,
        trigger_source: source,
        created_by: actor.userId,
      },
      { onConflict: 'org_id,city_id,item_id' },
    )
    .select('id')
    .single();

  if (error) {
    console.error('CityScan: failed to persist observation:', error);
    return null;
  }
  return data.id;
}

/**
 * Upsert the finding for an accepted pair (conflict target = unique before/
 * after observation pair; `cityscan_findings` has no created_by column —
 * attribution flows through the observation FKs).
 */
async function persistFinding(
  supabase: SupabaseClient,
  actor: ScanActor,
  cityId: string,
  beforeObsId: string,
  afterObsId: string,
  result: ScanResult,
): Promise<string | null> {
  const metrics = result.metrics;
  if (!metrics) return null;

  const { data, error } = await supabase
    .from('cityscan_findings')
    .upsert(
      {
        org_id: actor.orgId,
        city_id: cityId,
        before_observation_id: beforeObsId,
        after_observation_id: afterObsId,
        ndvi_mean_before: metrics.ndviMeanBefore,
        ndvi_mean_after: metrics.ndviMeanAfter,
        ndwi_mean_before: metrics.ndwiMeanBefore,
        ndwi_mean_after: metrics.ndwiMeanAfter,
        vegetation_area_ha_before: metrics.vegetationAreaHaBefore,
        vegetation_area_ha_after: metrics.vegetationAreaHaAfter,
        water_area_ha_before: metrics.waterClassifiedAreaHaBefore,
        water_area_ha_after: metrics.waterClassifiedAreaHaAfter,
        vegetation_loss_ha: metrics.vegetationLossThresholdAreaHa,
        vegetation_gain_ha: metrics.vegetationGainThresholdAreaHa,
        water_gain_ha: metrics.waterGainThresholdAreaHa,
        water_loss_ha: metrics.waterLossThresholdAreaHa,
        pixel_area_ha: metrics.pixelAreaHa,
        method_version: result.method,
        quorum_required_pct: result.quorumRequiredPct,
        common_valid_pct: result.commonValidPct,
      },
      { onConflict: 'before_observation_id,after_observation_id' },
    )
    .select('id')
    .single();

  if (error) {
    console.error('CityScan: failed to persist finding:', error);
    return null;
  }
  return data.id;
}

/**
 * Execute one city scan. Never throws for operational failures — returns a
 * CityScanResponse with status FAILED and the reason preserved.
 */
export async function executeScan(
  params: ExecuteScanParams,
  context: ExecuteScanContext,
): Promise<CityScanResponse> {
  const { actor, supabase } = context;
  const city = cities.find((entry) => entry.id === params.cityId);

  if (!city) {
    return buildResponse({
      status: 'FAILED',
      cityId: params.cityId,
      persisted: false,
      rejectionReason: `Unknown cityId: ${params.cityId}`,
    });
  }

  const aoi = computeCityAoI(city.coordinates.latitude, city.coordinates.longitude);
  const expectedEpsg = expectedUtmEpsg(city.coordinates.latitude, city.coordinates.longitude);
  const lons = aoi.map(([lon]) => lon);
  const lats = aoi.map(([, lat]) => lat);
  const bbox: [number, number, number, number] = [
    Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats),
  ];
  const manual = Boolean(params.beforeId && params.afterId);

  // Metas are hoisted so the catch block can record real metadata for
  // failures that happen after discovery (nothing fabricated, nothing lost).
  let beforeItem: StacItem | null = null;
  let afterItem: StacItem | null = null;
  let beforeMeta: StacMeta | null = null;
  let afterMeta: StacMeta | null = null;
  // Discovery context surfaced on every response so the UI can explain
  // which window was searched and how many scenes were checked.
  let discoveryWindowDays = 14;
  let discoveryMatched = 0;

  const persist = (input: ObservationInput): Promise<string | null> => {
    if (!supabase || !actor) return Promise.resolve(null);
    return persistObservation(supabase, actor, city.id, input, context.source);
  };

  try {
    if (manual) {
      beforeItem = await fetchStacItem(String(params.beforeId));
      afterItem = await fetchStacItem(String(params.afterId));
      if (beforeItem.id === afterItem.id) {
        throw new Error(
          'The before and after observations must be different scenes; the same STAC item is not a change pair.',
        );
      }
      beforeMeta = extractStacMeta(beforeItem);
      afterMeta = extractStacMeta(afterItem);
      if (Date.parse(beforeMeta.acquiredAt) >= Date.parse(afterMeta.acquiredAt)) {
        throw new Error('The before observation must be earlier than the after observation.');
      }
    } else {
      // Discovery pass 1: default 14-day window (fresh change signal).
      // Pass 2 (only when pass 1 yields NO pair): extended lookback so a
      // cloudy fortnight still produces a real map instead of a dead end.
      discoveryWindowDays = 14;
      discoveryMatched = 0;
      type DiscoveredPair =
        | { after: StacItem; afterM: StacMeta; before: StacItem }
        | { after: StacItem; afterM: StacMeta; matched: number; clear: number };
      const discoverPair = async (lookbackDays: number): Promise<DiscoveredPair | null> => {
        const recent = await searchStacItems(bbox, { cloudGatePct: CLOUD_GATE_PCT, lookbackDays });
        discoveryMatched = Math.max(discoveryMatched, recent.matched);
        if (recent.items.length === 0) return null;
        const after = recent.items[0];
        const afterM = extractStacMeta(after);
        const prior = await searchStacItems(bbox, {
          cloudGatePct: CLOUD_GATE_PCT,
          before: afterM.acquiredAt,
        });
        discoveryMatched = Math.max(discoveryMatched, prior.matched);
        const afterIdInner = after.id;
        const afterAcquiredAt = afterM.acquiredAt;
        const sameTile = prior.items.filter((item) => {
          if (item.properties['grid:code'] !== afterM.tile) return false;
          // The `../before` window is inclusive of its endpoint, so the after
          // item itself can reappear here. Pairing a scene with itself is not a
          // change pair — runScan rejects equal datetimes — so exclude it and
          // require a strictly earlier acquisition.
          if (item.id === afterIdInner) return false;
          const itemMs = Date.parse(item.properties.datetime);
          const afterMs = Date.parse(afterAcquiredAt);
          return Number.isFinite(itemMs) && Number.isFinite(afterMs) && itemMs < afterMs;
        });
        if (sameTile.length === 0) return { after, afterM, matched: prior.matched, clear: prior.items.length };
        return { after, afterM, before: sameTile[0] };
      };

      let pair = await discoverPair(14);
      if (!pair && RETRY_LOOKBACK_DAYS > 14) {
        discoveryWindowDays = RETRY_LOOKBACK_DAYS;
        pair = await discoverPair(RETRY_LOOKBACK_DAYS);
      }
      if (!pair) {
        const reason =
          `No clear same-tile Sentinel-2 L2A pair in the last ${discoveryWindowDays} days ` +
          `(${discoveryMatched} scenes checked, all failed the eo:cloud_cover < ${CLOUD_GATE_PCT}% gate ` +
          `or no earlier same-tile scene). Try a manual before/after pair or run again later.`;
        const observationId = await persist({
          itemId: attemptItemId(),
          meta: null,
          status: 'no_clear_observation',
          rejectionReason: reason,
          totalAoiPixels: 0,
          commonValidPct: null,
        });
        return buildResponse({
          status: 'NO_CLEAR_OBSERVATION',
          cityId: city.id,
          persisted: observationId !== null,
          observationId,
          rejectionReason: reason,
          discoveryWindowDays,
          discoveryMatched,
        });
      }
      if (!('before' in pair)) {
        const reason = pair.clear === 0
          ? `All ${pair.matched} earlier scenes failed the eo:cloud_cover < ${CLOUD_GATE_PCT}% gate.`
          : `Earlier clear scenes exist but none on tile ${pair.afterM.tile} (cross-tile pairs are rejected by design).`;
        const observationId = await persist({
          itemId: pair.afterM.itemId,
          meta: pair.afterM,
          status: 'no_clear_observation',
          rejectionReason: reason,
          totalAoiPixels: 0,
          commonValidPct: null,
        });
        return buildResponse({
          status: 'NO_CLEAR_OBSERVATION',
          cityId: city.id,
          persisted: observationId !== null,
          observationId,
          itemIds: [null, pair.afterM.itemId],
          dates: { before: null, after: pair.afterM.acquiredAt },
          tile: pair.afterM.tile,
          epsg: pair.afterM.epsg,
          rejectionReason: reason,
          discoveryWindowDays,
          discoveryMatched,
          cloudCoverPctBefore: null,
          cloudCoverPctAfter: pair.afterM.cloudCoverPct,
          baselineBefore: null,
          baselineAfter: pair.afterM.processingBaseline,
        });
      }

      afterItem = pair.after;
      afterMeta = pair.afterM;
      beforeItem = pair.before;
      beforeMeta = extractStacMeta(beforeItem);
    }
    // ---- Read both scenes and run the verified Phase 3 detection ----
    if (!beforeItem || !afterItem || !beforeMeta || !afterMeta) {
      throw new Error('Internal: scan discovery produced no before/after items.');
    }
    // Manual pairs validate each item against its own claimed tile (a cross-
    // tile mismatch is then rejected by runScan); discovered pairs pin the
    // prior scene to the after scene's tile so a cross-tile pair fails fast.
    const beforeExpectedTile = manual ? beforeMeta.tile : afterMeta.tile;
    const beforeScene = await readScene(beforeItem.id, {
      aoi,
      expectedTile: beforeExpectedTile,
      expectedEpsg,
    });
    const afterScene = await readScene(afterItem.id, {
      aoi,
      expectedTile: afterMeta.tile,
      expectedEpsg,
    });
    const result: ScanResult = runScan(beforeScene, afterScene, beforeScene.effectiveAoi ?? aoi);

    const pairStatus: ObservationStatus = result.status === 'ACCEPTED'
      ? 'accepted'
      : 'rejected_quorum';
    const pairReason = result.rejectionReason ?? null;

    const beforeObsId = await persist({
      itemId: beforeMeta.itemId,
      meta: beforeMeta,
      status: pairStatus,
      rejectionReason: pairReason,
      totalAoiPixels: result.totalAoiPixels,
      validPixels: result.commonValidPixels,
      commonValidPct: result.commonValidPct,
    });
    const afterObsId = await persist({
      itemId: afterMeta.itemId,
      meta: afterMeta,
      status: pairStatus,
      rejectionReason: pairReason,
      totalAoiPixels: result.totalAoiPixels,
      validPixels: result.commonValidPixels,
      commonValidPct: result.commonValidPct,
    });

    let findingId: string | null = null;
    if (
      result.status === 'ACCEPTED' && result.metrics
      && supabase && actor && beforeObsId && afterObsId
    ) {
      findingId = await persistFinding(supabase, actor, city.id, beforeObsId, afterObsId, result);
    }

    return buildResponse({
      status: result.status,
      cityId: city.id,
      persisted: beforeObsId !== null || afterObsId !== null,
      observationId: afterObsId,
      beforeObservationId: beforeObsId,
      afterObservationId: afterObsId,
      findingId,
      itemIds: [beforeMeta.itemId, afterMeta.itemId],
      dates: { before: beforeMeta.acquiredAt, after: afterMeta.acquiredAt },
      tile: result.tile,
      epsg: result.epsg,
      totalAoiPixels: result.totalAoiPixels,
      commonValidPixels: result.commonValidPixels,
      commonValidPct: result.commonValidPct,
      quorumRequiredPct: result.quorumRequiredPct,
      rejectionReason: pairReason,
      metrics: result.metrics ?? null,
      discoveryWindowDays,
      discoveryMatched,
      cloudCoverPctBefore: beforeMeta.cloudCoverPct,
      cloudCoverPctAfter: afterMeta.cloudCoverPct,
      baselineBefore: beforeMeta.processingBaseline,
      baselineAfter: afterMeta.processingBaseline,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`CityScan scan failed for ${city.id}: ${message}`);
    const safeMessage = sanitizeFailureMessage(message);

    let beforeObsId: string | null = null;
    let afterObsId: string | null = null;
    if (afterMeta) {
      afterObsId = await persist({
        itemId: afterMeta.itemId,
        meta: afterMeta,
        status: 'failed',
        rejectionReason: safeMessage,
        totalAoiPixels: 0,
        commonValidPct: null,
      });
    }
    if (beforeMeta) {
      beforeObsId = await persist({
        itemId: beforeMeta.itemId,
        meta: beforeMeta,
        status: 'failed',
        rejectionReason: safeMessage,
        totalAoiPixels: 0,
        commonValidPct: null,
      });
    }
    if (!beforeMeta && !afterMeta) {
      beforeObsId = await persist({
        itemId: attemptItemId(),
        meta: null,
        status: 'failed',
        rejectionReason: safeMessage,
        totalAoiPixels: 0,
        commonValidPct: null,
      });
    }

    return buildResponse({
      status: 'FAILED',
      cityId: city.id,
      persisted: afterObsId !== null || beforeObsId !== null,
      observationId: afterObsId ?? beforeObsId,
      beforeObservationId: beforeMeta ? beforeObsId : null,
      afterObservationId: afterMeta ? afterObsId : null,
      itemIds: [beforeMeta?.itemId ?? null, afterMeta?.itemId ?? null],
      dates: {
        before: beforeMeta?.acquiredAt ?? null,
        after: afterMeta?.acquiredAt ?? null,
      },
      tile: afterMeta?.tile ?? beforeMeta?.tile ?? null,
      epsg: afterMeta?.epsg ?? beforeMeta?.epsg ?? null,
      rejectionReason: safeMessage,
    });
  }
}