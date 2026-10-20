/**
 * GET /api/cityscan/pairs?cityId=<id>
 *
 * List accepted pairs for the pair selector (dates, tile, cloud share, baseline).
 * Read-only. Public-first (Phase 4C):
 *  - signed-in org members → org-scoped rows from cityscan_findings
 *    (member-read RLS policies, unchanged);
 *  - everyone else → accepted-only rows from the cityscan_public_findings
 *    view (explicit column allowlist; no org_id / created_by exposure).
 *
 * Joins cityscan_findings with cityscan_observations for before/after details.
 */

import {
  publicDataUnavailable,
  publicViewsMissing,
  resolveReadAccess,
} from '../lib/auth';
import {
  mapPublicFindingSummary,
  type PublicFindingRow,
} from '../lib/public';
import type { FindingRow } from '../lib/types';

export const dynamic = 'force-dynamic';

const PUBLIC_FINDING_COLUMNS = `
  id, city_id, created_at, method_version, quorum_required_pct, common_valid_pct,
  ndvi_mean_before, ndvi_mean_after, ndwi_mean_before, ndwi_mean_after,
  vegetation_area_ha_before, vegetation_area_ha_after,
  water_area_ha_before, water_area_ha_after,
  vegetation_loss_ha, vegetation_gain_ha, water_gain_ha, water_loss_ha,
  pixel_area_ha,
  before_item_id, before_acquired_at, before_tile, before_cloud_cover_pct,
  before_processing_baseline,
  after_item_id, after_acquired_at, after_tile, after_cloud_cover_pct,
  after_processing_baseline
`;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const cityId = url.searchParams.get('cityId');
  const orgId = url.searchParams.get('orgId');

  if (!cityId) {
    return Response.json({ error: 'cityId query parameter is required.' }, { status: 400 });
  }

  const access = await resolveReadAccess({ orgId });

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  if (access.kind === 'public') {
    const { data, error } = await supabase
      .from('cityscan_public_findings')
      .select(PUBLIC_FINDING_COLUMNS)
      .eq('city_id', cityId)
      .order('created_at', { ascending: false });

    if (error) {
      if (publicViewsMissing(error)) return publicDataUnavailable();
      console.error('Failed to fetch public pairs:', error);
      return Response.json({ error: 'Failed to fetch pairs.' }, { status: 500 });
    }

    const pairs = ((data ?? []) as PublicFindingRow[]).map(mapPublicFindingSummary);
    return Response.json({ cityId, count: pairs.length, pairs });
  }

  const { data, error } = await supabase
    .from('cityscan_findings')
    .select(`
      *,
      before_observation:cityscan_observations!cityscan_findings_before_observation_id_fkey (
        id, item_id, acquired_at, tile, cloud_cover_pct, processing_baseline
      ),
      after_observation:cityscan_observations!cityscan_findings_after_observation_id_fkey (
        id, item_id, acquired_at, tile, cloud_cover_pct, processing_baseline, trigger_source
      )
    `)
    .eq('org_id', access.orgId)
    .eq('city_id', cityId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch pairs:', error);
    return Response.json({ error: 'Failed to fetch pairs.' }, { status: 500 });
  }

  const pairs = (data ?? []).map((finding: FindingRow) => {
    const before = finding.before_observation;
    const after = finding.after_observation;
    return {
      id: finding.id,
      cityId: finding.city_id,
      beforeId: before?.item_id,
      afterId: after?.item_id,
      beforeAcquiredAt: before?.acquired_at,
      afterAcquiredAt: after?.acquired_at,
      tile: after?.tile,
      cloudCoverPctBefore: before?.cloud_cover_pct,
      cloudCoverPctAfter: after?.cloud_cover_pct,
      baselineBefore: before?.processing_baseline,
      baselineAfter: after?.processing_baseline,
      ndviMeanBefore: finding.ndvi_mean_before,
      ndviMeanAfter: finding.ndvi_mean_after,
      ndwiMeanBefore: finding.ndwi_mean_before,
      ndwiMeanAfter: finding.ndwi_mean_after,
      vegetationAreaHaBefore: finding.vegetation_area_ha_before,
      vegetationAreaHaAfter: finding.vegetation_area_ha_after,
      waterAreaHaBefore: finding.water_area_ha_before,
      waterAreaHaAfter: finding.water_area_ha_after,
      vegetationLossHa: finding.vegetation_loss_ha,
      vegetationGainHa: finding.vegetation_gain_ha,
      waterGainHa: finding.water_gain_ha,
      waterLossHa: finding.water_loss_ha,
      pixelAreaHa: finding.pixel_area_ha,
      commonValidPct: finding.common_valid_pct,
      quorumRequiredPct: finding.quorum_required_pct,
      methodVersion: finding.method_version,
      createdAt: finding.created_at,
    };
  });

  return Response.json({
    cityId,
    count: pairs.length,
    pairs,
  });
}