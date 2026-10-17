/**
 * GET /api/cityscan/observations?cityId=<id>&limit=<n>&orgId=<uuid>
 *
 * List observations for a city (newest first). Public-first (Phase 4C):
 *  - signed-in org members → org-scoped rows from cityscan_observations
 *    (member-read RLS, unchanged; `orgId` selects the active organisation
 *    for multi-org users, defaulting to the oldest membership);
 *  - everyone else → accepted-only rows from the cityscan_public_observations
 *    view (column allowlist; no org_id / created_by / band_assets, and never
 *    rejected or failed scan attempts).
 * Read-only.
 */

import {
  publicDataUnavailable,
  publicViewsMissing,
  resolveReadAccess,
} from '../lib/auth';
import {
  mapPublicObservation,
  type PublicObservationRow,
} from '../lib/public';

export const dynamic = 'force-dynamic';

interface ObservationRow {
  id: string;
  item_id: string;
  acquired_at: string | null;
  platform: string | null;
  tile: string | null;
  processing_baseline: string | null;
  cloud_cover_pct: number | null;
  valid_pixels: number | null;
  total_aoi_pixels: number;
  common_valid_pct: number | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  trigger_source: string | null;
  band_assets: Record<string, string> | null;
}

const PUBLIC_OBSERVATION_COLUMNS = `
  id, item_id, acquired_at, platform, tile, processing_baseline,
  cloud_cover_pct, valid_pixels, total_aoi_pixels, common_valid_pct,
  status, trigger_source, created_at
`;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const cityId = url.searchParams.get('cityId');
  const orgId = url.searchParams.get('orgId');
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 50, 100) : 50;

  if (!cityId) {
    return Response.json({ error: 'cityId query parameter is required.' }, { status: 400 });
  }

  const access = await resolveReadAccess({ orgId });

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  if (access.kind === 'public') {
    const { data, error } = await supabase
      .from('cityscan_public_observations')
      .select(PUBLIC_OBSERVATION_COLUMNS)
      .eq('city_id', cityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (publicViewsMissing(error)) return publicDataUnavailable();
      console.error('Failed to fetch public observations:', error);
      return Response.json({ error: 'Failed to fetch observations.' }, { status: 500 });
    }

    const rows = (data ?? []) as PublicObservationRow[];
    return Response.json({
      cityId,
      count: rows.length,
      observations: rows.map(mapPublicObservation),
    });
  }

  const { data, error } = await supabase
    .from('cityscan_observations')
    .select('id, item_id, acquired_at, platform, tile, processing_baseline, cloud_cover_pct, valid_pixels, total_aoi_pixels, common_valid_pct, status, rejection_reason, created_at, trigger_source, band_assets')
    .eq('org_id', access.orgId)
    .eq('city_id', cityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch observations:', error);
    return Response.json({ error: 'Failed to fetch observations.' }, { status: 500 });
  }

  const rows = (data ?? []) as ObservationRow[];
  return Response.json({
    cityId,
    count: rows.length,
    observations: rows.map((row) => ({
      id: row.id,
      itemId: row.item_id,
      acquiredAt: row.acquired_at,
      platform: row.platform,
      tile: row.tile,
      processingBaseline: row.processing_baseline,
      cloudCoverPct: row.cloud_cover_pct,
      status: row.status,
      validPixels: row.valid_pixels,
      totalAoiPixels: row.total_aoi_pixels,
      commonValidPct: row.common_valid_pct,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      triggerSource: row.trigger_source ?? 'manual',
      bandAssets: row.band_assets,
    })),
  });
}