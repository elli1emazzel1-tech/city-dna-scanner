'use strict';

// CityScan Phase 3 reliability-hardening runner.
// Usage: node poc3.cjs [before-item-id] [after-item-id]
const { fromUrl } = require('geotiff');
// proj4 ships CJS, but bundlers (Next.js Turbopack) may interop-wrap it as
// `{ default: fn }`. Unwrap once so `proj4(...)` stays callable in both the
// plain-Node CLI and the Next.js route runtime.
const proj4Module = require('proj4');
const proj4 = typeof proj4Module === 'function' ? proj4Module : proj4Module.default;
const {
  METHOD, verifyGrids, summarizeCommonPixels, haFromPx,
} = require('./hardened.cjs');

const STAC = 'https://earth-search.aws.element84.com/v1';
const BEFORE_ID = process.argv[2] || 'S2C_31UFT_20250819_0_L2A';
const AFTER_ID = process.argv[3] || 'S2C_31UFT_20260814_0_L2A';
const AOI = [[4.83, 52.26], [4.91, 52.26], [4.91, 52.32], [4.83, 52.32]];
const EPSG = METHOD.expectedEpsg;
const t0 = Date.now();
const log = (message) => console.log(`[+${((Date.now() - t0) / 1000).toFixed(1)}s] ${message}`);

function boundsOfAoi(aoi) {
  return {
    minLon: Math.min(...aoi.map(([lon]) => lon)),
    maxLon: Math.max(...aoi.map(([lon]) => lon)),
    minLat: Math.min(...aoi.map(([, lat]) => lat)),
    maxLat: Math.max(...aoi.map(([, lat]) => lat)),
  };
}

/**
 * Intersect a lon/lat AOI ring with a hard bbox clamp so the projected window
 * stays inside one MGRS tile raster. Large city AOIs can straddle a tile edge
 * (e.g. a 10 km London AOI vs. the left edge of 30UYC at 699960m E); reading
 * outside the raster throws. Clipping keeps the in-tile portion — build masks
 * from the clipped AOI so pairing still uses exactly the common pixels.
 */
function clipAoiToBbox(aoi, bbox) {
  const clipped = aoi.map(([lon, lat]) => [
    Math.min(Math.max(lon, bbox.minLon), bbox.maxLon),
    Math.min(Math.max(lat, bbox.minLat), bbox.maxLat),
  ]);
  const lons = clipped.map(([lon]) => lon);
  const lats = clipped.map(([, lat]) => lat);
  if (Math.min(...lons) >= Math.max(...lons) || Math.min(...lats) >= Math.max(...lats)) {
    throw new Error('AOI does not overlap the raster tile after clipping to tile bounds.');
  }
  return clipped;
}

async function stacItem(id) {
  const response = await fetch(`${STAC}/collections/sentinel-2-l2a/items/${encodeURIComponent(id)}`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`STAC item ${id}: HTTP ${response.status}`);
  const item = await response.json();
  if (!item || item.type !== 'Feature' || item.id !== id || !item.properties || !item.assets) {
    throw new Error(`STAC item ${id} has an invalid feature structure.`);
  }
  return item;
}

async function readGrid(url, aoi, expectedEpsg = EPSG) {
  const signal = AbortSignal.timeout(90_000);
  const tiff = await fromUrl(url, { headers: { 'User-Agent': 'cityscan-p3/1.0' }, cache: false }, signal);
  const image = await tiff.getImage();
  const geoKeys = image.getGeoKeys();
  const epsg = geoKeys?.ProjectedCSTypeGeoKey;
  if (epsg !== expectedEpsg) throw new Error(`Raster CRS EPSG:${epsg ?? 'unknown'} does not match required EPSG:${expectedEpsg}.`);

  const [sourceX, sourceY] = image.getOrigin();
  const [resX, resY] = image.getResolution();
  if (!(resX > 0) || !(resY < 0)) throw new Error(`Unsupported raster transform/resolution ${resX},${resY}.`);
  const projected = aoi.map(([lon, lat]) => proj4('EPSG:4326', `EPSG:${expectedEpsg}`, [lon, lat]));
  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);
  const window = [
    Math.max(0, Math.floor((Math.min(...xs) - sourceX) / resX)),
    Math.max(0, Math.floor((sourceY - Math.max(...ys)) / Math.abs(resY))),
    Math.min(image.getWidth(), Math.ceil((Math.max(...xs) - sourceX) / resX)),
    Math.min(image.getHeight(), Math.ceil((sourceY - Math.min(...ys)) / Math.abs(resY))),
  ];
  if (window[2] <= window[0] || window[3] <= window[1]) {
    throw new Error(`AOI window ${window.join(',')} lies outside raster bounds ${image.getWidth()}x${image.getHeight()}.`);
  }

  const data = await image.readRasters({ window, interleave: true, signal });
  const width = window[2] - window[0];
  const height = window[3] - window[1];
  if (data.length !== width * height) {
    throw new Error(`Raster returned ${data.length} samples for expected ${width}x${height} window.`);
  }
  return {
    data,
    width,
    height,
    origin: [sourceX + window[0] * resX, sourceY + window[1] * resY],
    res: [resX, resY],
    crs: epsg,
  };
}

// Reads one STAC item and its band windows. Phase 4B: options allow per-city
// AOI/tile/CRS; omitted options preserve the Phase 3 Amsterdam behaviour exactly.
async function getRasterGeographicBounds(url, expectedEpsg) {
  const tiff = await fromUrl(url, { headers: { 'User-Agent': 'cityscan-p3/1.0' }, cache: false }, AbortSignal.timeout(90_000));
  const image = await tiff.getImage();
  const geoKeys = image.getGeoKeys();
  const epsg = geoKeys?.ProjectedCSTypeGeoKey;
  if (epsg !== expectedEpsg) throw new Error('Raster CRS EPSG:' + (epsg ?? 'unknown') + ' does not match required EPSG:' + expectedEpsg + '.');
  const [sourceX, sourceY] = image.getOrigin();
  const [resX, resY] = image.getResolution();
  const width = image.getWidth();
  const height = image.getHeight();
  const corners = [[sourceX, sourceY], [sourceX + width * resX, sourceY], [sourceX + width * resX, sourceY + height * resY], [sourceX, sourceY + height * resY]];
  const projected = corners.map(([x, y]) => proj4('EPSG:' + expectedEpsg, 'EPSG:4326', [x, y]));
  const lons = projected.map((p) => p[0]);
  const lats = projected.map((p) => p[1]);
  return { minLon: Math.min(...lons), maxLon: Math.max(...lons), minLat: Math.min(...lats), maxLat: Math.max(...lats) };
}

async function readScene(id, options = {}) {
  const aoi = options.aoi ?? AOI;
  const expectedTile = options.expectedTile ?? 'MGRS-31UFT';
  const expectedEpsg = options.expectedEpsg ?? EPSG;
  log('fetching STAC record ' + id);
  const item = await stacItem(id);
  const properties = item.properties;
  if (properties['grid:code'] !== expectedTile) {
    throw new Error(id + ' is not the expected ' + expectedTile + ' scene.');
  }
  const actualEpsg = Number(properties['proj:epsg']);
  if (!Number.isFinite(actualEpsg)) {
    throw new Error(id + ' has no valid proj:epsg.');
  }
  if (!Number.isFinite(Date.parse(properties.datetime))
    || !Number.isFinite(properties['eo:cloud_cover'])
    || typeof properties.platform !== 'string'
    || properties['earthsearch:boa_offset_applied'] !== true) {
    throw new Error(id + ' has missing/invalid acquisition metadata.');
  }

  // b04_assetKey is the STAC asset key (e.g. "red"), not the band name.
  const b04AssetKey = Object.values(METHOD.bands)[0];
  const href = item.assets[b04AssetKey]?.href;
  if (typeof href !== 'string') throw new Error(id + ' has no ' + b04AssetKey + ' COG asset.');
  const tiff = await fromUrl(href, { headers: { 'User-Agent': 'cityscan-p3/1.0' }, cache: false }, AbortSignal.timeout(90_000));
  const image = await tiff.getImage();
  const [sourceX, sourceY] = image.getOrigin();
  const [resX, resY] = image.getResolution();
  const width = image.getWidth();
  const height = image.getHeight();
  const rasterXMin = sourceX;
  const rasterXMax = sourceX + width * resX;
  const rasterYMin = sourceY + height * resY;
  const rasterYMax = sourceY;

  // The raster footprint in lon/lat is curved, so a lon/lat bbox clip still
  // admits windows past the real raster edges. Clip the AOI in projected
  // (UTM) space to the raster's exact projected extents and inverse-project
  // back to lon/lat for the grid reader. Use the scene's actual CRS (not the
  // city-computed expected EPSG) since tiles near UTM zone boundaries may be
  // published in a neighboring zone (e.g. Berlin 32UQD is EPSG:32632, not 32633).
  const projected = aoi.map(([lon, lat]) => proj4('EPSG:4326', `EPSG:${actualEpsg}`, [lon, lat]));
  const clippedProj = projected.map(([x, y]) => [
    Math.min(Math.max(x, rasterXMin), rasterXMax),
    Math.min(Math.max(y, rasterYMin), rasterYMax),
  ]);
  const effectiveAoi = clippedProj.map(([x, y]) => proj4(`EPSG:${actualEpsg}`, 'EPSG:4326', [x, y]));

  const grids = {};

  for (const [band, assetKey] of Object.entries(METHOD.bands)) {
    const href = item.assets[assetKey]?.href;
    if (typeof href !== 'string') throw new Error(id + ' has no ' + assetKey + ' COG asset.');
    grids[band] = await readGrid(href, effectiveAoi, actualEpsg);
    log(id + ' ' + band + ': ' + grids[band].width + 'x' + grids[band].height + ' at ' + grids[band].res.join(',') + 'm EPSG:' + grids[band].crs);
  }
  return {
    id,
    meta: {
      datetime: properties.datetime,
      cloud: properties['eo:cloud_cover'],
      baseline: properties['s2:processing_baseline'] ?? null,
      platform: properties.platform,
      tile: properties['grid:code'],
      epsg: properties['proj:epsg'],
      boaOffsetApplied: properties['earthsearch:boa_offset_applied'],
    },
    grids,
    effectiveAoi,
  };
}

function gridValueAt(grid, x, y) {
  const column = Math.floor((x - grid.origin[0]) / grid.res[0]);
  const row = Math.floor((y - grid.origin[1]) / grid.res[1]);
  if (column < 0 || column >= grid.width || row < 0 || row >= grid.height) {
    throw new Error('A pixel centre falls outside one of the aligned band windows.');
  }
  return grid.data[row * grid.width + column];
}

function buildPixelArrays(before, after, aoi) {
  const reference = before.grids.B04;
  const width = reference.width;
  const height = reference.height;
  const length = width * height;
  const aoiMask = new Uint8Array(length);
  const beforePixels = {
    red: before.grids.B04.data,
    nir: before.grids.B08.data,
    green: before.grids.B03.data,
    scl: new Uint8Array(length),
  };
  const afterPixels = {
    red: after.grids.B04.data,
    nir: after.grids.B08.data,
    green: after.grids.B03.data,
    scl: new Uint8Array(length),
  };
  const bounds = boundsOfAoi(aoi);
  let totalAoi = 0;

  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const index = row * width + column;
      const x = reference.origin[0] + (column + 0.5) * reference.res[0];
      const y = reference.origin[1] + (row + 0.5) * reference.res[1];
      const [lon, lat] = proj4(`EPSG:${reference.crs}`, 'EPSG:4326', [x, y]);
      if (lon < bounds.minLon || lon > bounds.maxLon || lat < bounds.minLat || lat > bounds.maxLat) continue;
      aoiMask[index] = 1;
      totalAoi += 1;
      beforePixels.scl[index] = gridValueAt(before.grids.SCL, x, y);
      afterPixels.scl[index] = gridValueAt(after.grids.SCL, x, y);
    }
  }
  if (totalAoi === 0) throw new Error('The AOI contains no pixel centres in the selected raster window.');
  return { beforePixels, afterPixels, aoiMask, width, height, totalAoi };
}

function runScan(before, after, aoi) {
  if (before.meta.tile !== after.meta.tile || before.meta.epsg !== after.meta.epsg) {
    throw new Error('Observations do not share the same MGRS tile and CRS.');
  }
  if (Date.parse(before.meta.datetime) >= Date.parse(after.meta.datetime)) {
    throw new Error('The before observation must be earlier than the after observation.');
  }
  const grids = [];
  for (const [epoch, scene] of [['before', before], ['after', after]]) {
    for (const [band, grid] of Object.entries(scene.grids)) grids.push({ name: `${epoch}.${band}`, grid });
  }
  const alignmentErrors = verifyGrids(grids);
  if (alignmentErrors.length) throw new Error(`Band alignment/CRS/resolution verification failed: ${alignmentErrors.join('; ')}`);
  log(`verified five bands across both scenes: tile ${before.meta.tile}, EPSG:${before.meta.epsg}; 10m/20m grids aligned`);

  const { beforePixels, afterPixels, aoiMask, width, height, totalAoi } = buildPixelArrays(before, after, aoi);
  const result = summarizeCommonPixels(beforePixels, afterPixels, aoiMask);
  const output = {
    status: result.quorumMet ? 'ACCEPTED' : 'REJECTED_INSUFFICIENT_COMMON_VALID_PIXELS',
    method: METHOD.name,
    quorumRequiredPct: METHOD.quorum * 100,
    before: { id: before.id, ...before.meta },
    after: { id: after.id, ...after.meta },
    tile: before.meta.tile,
    epsg: before.meta.epsg,
    bandsVerified: Object.keys(METHOD.bands),
    window: `${width}x${height}`,
    totalAoiPixels: totalAoi,
    commonValidPixels: result.commonValid,
    excludedPixels: totalAoi - result.commonValid,
    commonValidPct: Number(result.validPct.toFixed(2)),
    pixelAreaHa: METHOD.pixelHa,
    aoiAreaHaApprox: Number(haFromPx(totalAoi).toFixed(2)),
    thresholds: { vegetationNdvi: METHOD.veg, waterNdwi: METHOD.water, significantIndexDelta: METHOD.delta },
  };

  if (result.quorumMet) {
    const stats = result.stats;
    output.metrics = {
      ndviMeanBefore: Number(stats.ndviMeanBefore.toFixed(4)),
      ndviMeanAfter: Number(stats.ndviMeanAfter.toFixed(4)),
      ndwiMeanBefore: Number(stats.ndwiMeanBefore.toFixed(4)),
      ndwiMeanAfter: Number(stats.ndwiMeanAfter.toFixed(4)),
      vegetationAreaHaBefore: Number(haFromPx(stats.vegetationBefore).toFixed(2)),
      vegetationAreaHaAfter: Number(haFromPx(stats.vegetationAfter).toFixed(2)),
      waterClassifiedAreaHaBefore: Number(haFromPx(stats.waterBefore).toFixed(2)),
      waterClassifiedAreaHaAfter: Number(haFromPx(stats.waterAfter).toFixed(2)),
      vegetationLossThresholdAreaHa: Number(haFromPx(stats.vegetationLoss).toFixed(2)),
      vegetationGainThresholdAreaHa: Number(haFromPx(stats.vegetationGain).toFixed(2)),
      waterGainThresholdAreaHa: Number(haFromPx(stats.waterGain).toFixed(2)),
      waterLossThresholdAreaHa: Number(haFromPx(stats.waterLoss).toFixed(2)),
      changeMethod: 'Each epoch and change count use exactly the common-valid pixels from both observations.',
    };
  } else {
    output.metrics = null;
    output.rejectionReason = `Only ${output.commonValidPct}% of AOI pixels are valid in both observations; ${output.quorumRequiredPct}% is required. No change metrics were calculated.`;
  }
  return output;
}

async function main() {
  const before = await readScene(BEFORE_ID);
  const after = await readScene(AFTER_ID);
  // Phase 4B: pass the clipped effective AOI (already intersected with the real
  // raster bounds) so the window/mask logic never sees the raw unclipped AOI.
  const result = runScan(before, after, before.effectiveAoi);
  console.log(`RESULT ${JSON.stringify(result)}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`FAILED: ${error?.stack || error}`);
    process.exitCode = 1;
  });
}

module.exports = { AOI, buildPixelArrays, clipAoiToBbox, readGrid, readScene, runScan };
