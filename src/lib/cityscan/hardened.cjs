'use strict';

const METHOD = Object.freeze({
  name: 'cityscan-p3',
  quorum: 0.70,
  veg: 0.35,
  water: 0.1,
  delta: 0.15,
  minPaintPx: 5,
  cloudGate: 20,
  sclExclude: new Set([0, 1, 3, 8, 9, 10, 11]),
  sclWaterClass: 6,
  reflScale: 10000,
  pixelHa: 0.01,
  resolutions: Object.freeze({ B04: 10, B08: 10, B03: 10, B11: 20, SCL: 20 }),
  bands: Object.freeze({
    B04: 'red',
    B08: 'nir',
    B03: 'green',
    B11: 'swir16',
    SCL: 'scl',
  }),
  expectedEpsg: 32631,
});

function refl(raw) {
  return Number.isFinite(raw) && raw > 0 ? raw / METHOD.reflScale : null;
}

function ndvi(red, nir) {
  if (!Number.isFinite(red) || !Number.isFinite(nir) || red < 0 || nir < 0) return null;
  const sum = nir + red;
  return sum > 0 ? (nir - red) / sum : null;
}

function ndwi(green, nir) {
  if (!Number.isFinite(green) || !Number.isFinite(nir) || green < 0 || nir < 0) return null;
  const sum = green + nir;
  return sum > 0 ? (green - nir) / sum : null;
}

function sclIsExcluded(value) {
  return METHOD.sclExclude.has(value);
}

function sclIsValid(value) {
  return Number.isInteger(value) && !sclIsExcluded(value);
}

function sclIsWater(value) {
  return value === METHOD.sclWaterClass;
}

function maskFromSCL(scl, width, height, factor) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1
    || !Number.isInteger(factor) || factor < 1
    || !scl || !scl.data || !Number.isInteger(scl.width) || !Number.isInteger(scl.height)
    || scl.data.length !== scl.width * scl.height
    || scl.width !== Math.ceil(width / factor) || scl.height !== Math.ceil(height / factor)) {
    throw new Error('SCL dimensions do not match the requested reflectance grid and sampling factor.');
  }
  const mask = new Uint8Array(width * height);
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const valid = sclIsValid(scl.data[Math.floor(y / factor) * scl.width + Math.floor(x / factor)]);
      mask[y * width + x] = valid ? 1 : 0;
      if (valid) count += 1;
    }
  }
  return { mask, count, total: width * height };
}

function commonMask(a, b) {
  if (!a || !b || a.length !== b.length) throw new Error('Validity masks must have matching dimensions.');
  const mask = new Uint8Array(a.length);
  let count = 0;
  for (let i = 0; i < a.length; i += 1) {
    mask[i] = a[i] && b[i] ? 1 : 0;
    count += mask[i];
  }
  return { mask, count };
}

function meetsQuorum(commonValidPixels, totalAoiPixels, quorum = METHOD.quorum) {
  if (!Number.isInteger(commonValidPixels) || !Number.isInteger(totalAoiPixels)
    || commonValidPixels < 0 || totalAoiPixels < 1 || commonValidPixels > totalAoiPixels
    || !Number.isFinite(quorum) || quorum < 0 || quorum > 1) {
    throw new Error('Invalid common-valid pixel count or quorum.');
  }
  return commonValidPixels / totalAoiPixels >= quorum;
}

function normalizeCrs(crs) {
  if (typeof crs === 'number' && Number.isInteger(crs)) return `EPSG:${crs}`;
  if (typeof crs !== 'string') return null;
  const epsgMatch = crs.match(/(?:EPSG[:/]|urn:ogc:def:crs:EPSG::)(\d+)/i);
  return epsgMatch ? `EPSG:${Number(epsgMatch[1])}` : crs.trim().toUpperCase();
}

function near(a, b, tolerance = 1e-6) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
}

function verifyGrids(pairs) {
  const errors = [];
  if (!Array.isArray(pairs) || pairs.length === 0) return ['No band grids provided.'];
  let reference10m = null;
  const groups = new Map();
  let referenceCrs = null;

  for (const { name, grid } of pairs) {
    const band = String(name).split('.').pop();
    const expectedResolution = METHOD.resolutions[band];
    if (!grid || !expectedResolution) {
      errors.push(`${name}: missing grid metadata or unknown band.`);
      continue;
    }
    if (!Number.isInteger(grid.width) || !Number.isInteger(grid.height)
      || grid.width < 1 || grid.height < 1) {
      errors.push(`${name}: invalid window dimensions.`);
      continue;
    }
    if (!Array.isArray(grid.origin) || grid.origin.length < 2
      || !Array.isArray(grid.res) || grid.res.length < 2) {
      errors.push(`${name}: missing affine grid transform.`);
      continue;
    }
    const crs = normalizeCrs(grid.crs);
    if (!crs) errors.push(`${name}: CRS is missing.`);
    else if (referenceCrs && crs !== referenceCrs) errors.push(`${name}: CRS ${crs} != ${referenceCrs}.`);
    else referenceCrs = crs;

    const [rx, ry] = grid.res;
    if (!near(rx, expectedResolution) || !near(ry, -expectedResolution)) {
      errors.push(`${name}: expected ${expectedResolution}m north-up pixels, got ${rx},${ry}.`);
    }

    const previous = groups.get(expectedResolution);
    if (previous) {
      if (grid.width !== previous.grid.width || grid.height !== previous.grid.height) {
        errors.push(`${name}: window ${grid.width}x${grid.height} != ${previous.grid.width}x${previous.grid.height} at ${expectedResolution}m.`);
      }
      if (!near(grid.origin[0], previous.grid.origin[0]) || !near(grid.origin[1], previous.grid.origin[1])
        || !near(rx, previous.grid.res[0]) || !near(ry, previous.grid.res[1])) {
        errors.push(`${name}: grid origin/resolution does not align with ${previous.name}.`);
      }
    } else {
      groups.set(expectedResolution, { name, grid });
    }

    if (expectedResolution === 10 && !reference10m) reference10m = grid;
  }

  const twentyMeter = groups.get(20);
  if (reference10m && twentyMeter) {
    for (const [axis, index] of [['x', 0], ['y', 1]]) {
      const delta = (twentyMeter.grid.origin[index] - reference10m.origin[index]) / 10;
      if (!near(delta, Math.round(delta))) {
        errors.push(`20m grid origin is not aligned to the 10m ${axis} pixel lattice.`);
      }
    }
  }
  return errors;
}

function summarizeCommonPixels(before, after, aoiMask) {
  const arrays = ['red', 'nir', 'green', 'scl'];
  const length = aoiMask?.length;
  if (!Number.isInteger(length) || length < 1
    || arrays.some((key) => !before[key] || !after[key] || before[key].length !== length || after[key].length !== length)) {
    throw new Error('Paired band arrays and AOI mask must have identical non-empty lengths.');
  }

  let commonValid = 0;
  let ndviBeforeSum = 0, ndviAfterSum = 0, ndwiBeforeSum = 0, ndwiAfterSum = 0;
  let vegetationBefore = 0, vegetationAfter = 0, waterBefore = 0, waterAfter = 0;
  let vegetationLoss = 0, vegetationGain = 0, waterGain = 0, waterLoss = 0;
  let excluded = 0;
  const commonMaskResult = new Uint8Array(length);
  const pixels = [];

  for (let i = 0; i < length; i += 1) {
    if (!aoiMask[i]) continue;
    const red0 = refl(before.red[i]), nir0 = refl(before.nir[i]), green0 = refl(before.green[i]);
    const red1 = refl(after.red[i]), nir1 = refl(after.nir[i]), green1 = refl(after.green[i]);
    const vi0 = ndvi(red0, nir0), vi1 = ndvi(red1, nir1);
    const wi0 = ndwi(green0, nir0), wi1 = ndwi(green1, nir1);
    const valid = sclIsValid(before.scl[i]) && sclIsValid(after.scl[i])
      && vi0 !== null && vi1 !== null && wi0 !== null && wi1 !== null;
    if (!valid) {
      excluded += 1;
      continue;
    }

    commonMaskResult[i] = 1;
    commonValid += 1;
    ndviBeforeSum += vi0;
    ndviAfterSum += vi1;
    ndwiBeforeSum += wi0;
    ndwiAfterSum += wi1;
    const isWater0 = sclIsWater(before.scl[i]) || wi0 >= METHOD.water;
    const isWater1 = sclIsWater(after.scl[i]) || wi1 >= METHOD.water;
    if (isWater0) waterBefore += 1;
    if (isWater1) waterAfter += 1;
    if (!isWater0 && !isWater1) {
      if (vi0 >= METHOD.veg) vegetationBefore += 1;
      if (vi1 >= METHOD.veg) vegetationAfter += 1;
      if (vi1 - vi0 <= -METHOD.delta) vegetationLoss += 1;
      else if (vi1 - vi0 >= METHOD.delta) vegetationGain += 1;
    }
    if (!isWater0 && isWater1 && wi1 - wi0 >= METHOD.delta) waterGain += 1;
    else if (isWater0 && !isWater1 && wi1 - wi0 <= -METHOD.delta) waterLoss += 1;
    pixels.push(i);
  }

  const totalAoiPixels = aoiMask.reduce((sum, value) => sum + (value ? 1 : 0), 0);
  const quorumMet = totalAoiPixels > 0 && meetsQuorum(commonValid, totalAoiPixels);
  return {
    commonValid,
    excluded,
    totalAoiPixels,
    validPct: totalAoiPixels ? 100 * commonValid / totalAoiPixels : 0,
    quorumMet,
    commonMask: commonMaskResult,
    stats: quorumMet ? {
      ndviMeanBefore: ndviBeforeSum / commonValid,
      ndviMeanAfter: ndviAfterSum / commonValid,
      ndwiMeanBefore: ndwiBeforeSum / commonValid,
      ndwiMeanAfter: ndwiAfterSum / commonValid,
      vegetationBefore,
      vegetationAfter,
      waterBefore,
      waterAfter,
      vegetationLoss,
      vegetationGain,
      waterGain,
      waterLoss,
    } : null,
  };
}

function haFromPx(px) {
  return px * METHOD.pixelHa;
}

module.exports = {
  METHOD,
  refl,
  ndvi,
  ndwi,
  sclIsValid,
  sclIsExcluded,
  sclIsWater,
  maskFromSCL,
  commonMask,
  meetsQuorum,
  verifyGrids,
  summarizeCommonPixels,
  haFromPx,
};
