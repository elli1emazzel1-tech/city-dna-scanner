'use strict';

const assert = require('node:assert/strict');
const {
  METHOD,
  refl,
  ndvi,
  ndwi,
  sclIsValid,
  maskFromSCL,
  commonMask,
  meetsQuorum,
  verifyGrids,
  summarizeCommonPixels,
  haFromPx,
} = require('./hardened.cjs');

function makeGrid(width, height, origin, res, crs = 32631) {
  return { width, height, origin, res, crs };
}

function assertClose(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

function validGridPairs() {
  return [
    { name: 'before.B04', grid: makeGrid(4, 4, [100, 200], [10, -10]) },
    { name: 'before.B08', grid: makeGrid(4, 4, [100, 200], [10, -10]) },
    { name: 'before.B03', grid: makeGrid(4, 4, [100, 200], [10, -10]) },
    { name: 'before.B11', grid: makeGrid(2, 2, [100, 200], [20, -20]) },
    { name: 'before.SCL', grid: makeGrid(2, 2, [100, 200], [20, -20]) },
    { name: 'after.B04', grid: makeGrid(4, 4, [100, 200], [10, -10]) },
    { name: 'after.B08', grid: makeGrid(4, 4, [100, 200], [10, -10]) },
    { name: 'after.B03', grid: makeGrid(4, 4, [100, 200], [10, -10]) },
    { name: 'after.B11', grid: makeGrid(2, 2, [100, 200], [20, -20]) },
    { name: 'after.SCL', grid: makeGrid(2, 2, [100, 200], [20, -20]) },
  ];
}

assert.equal(METHOD.quorum, 0.70);
assert.equal(refl(5000), 0.5);
assert.equal(refl(0), null);
assertClose(ndvi(0.2, 0.8), 0.6);
assert.equal(ndvi(0, 0), null);
assertClose(ndwi(0.3, 0.7), -0.4);
assert.equal(sclIsValid(6), true, 'SCL water class remains a valid observation');
assert.equal(sclIsValid(9), false, 'SCL cloud class is excluded');

assert.equal(meetsQuorum(70, 100), true, 'quorum accepts exactly 70%');
assert.equal(meetsQuorum(69, 100), false, 'quorum rejects less than 70%');
assert.throws(() => meetsQuorum(101, 100), /Invalid common-valid/);

const masks = maskFromSCL(
  { data: Uint8Array.from([4, 9, 6, 8]), width: 2, height: 2 },
  4,
  4,
  2,
);
assert.equal(masks.total, 16);
assert.equal(masks.count, 8);
assert.equal(masks.mask[0], 1);
assert.equal(masks.mask[2], 0);
assert.throws(() => maskFromSCL({ data: new Uint8Array(1), width: 1, height: 1 }, 4, 4, 2), /dimensions/);

const common = commonMask(Uint8Array.from([1, 1, 0]), Uint8Array.from([1, 0, 1]));
assert.equal(common.count, 1);
assert.deepEqual([...common.mask], [1, 0, 0]);
assert.throws(() => commonMask(new Uint8Array(1), new Uint8Array(2)), /matching dimensions/);

assert.deepEqual(verifyGrids(validGridPairs()), []);
const wrongResolution = validGridPairs();
wrongResolution[1].grid.res = [20, -20];
assert.ok(verifyGrids(wrongResolution).some((error) => error.includes('expected 10m')));
const wrongCrs = validGridPairs();
wrongCrs[5].grid.crs = 32632;
assert.ok(verifyGrids(wrongCrs).some((error) => error.includes('CRS EPSG:32632')));
const misaligned = validGridPairs();
misaligned[6].grid.origin = [101, 200];
assert.ok(verifyGrids(misaligned).some((error) => error.includes('grid origin/resolution')));
const misalignedTwenty = validGridPairs();
misalignedTwenty[3].grid.origin = [105, 200];
assert.ok(verifyGrids(misalignedTwenty).some((error) => error.includes('20m grid origin')));

const length = 10;
const aoiMask = new Uint8Array(length).fill(1);
const before = {
  red: new Uint16Array(length).fill(2000),
  nir: new Uint16Array(length).fill(8000),
  green: new Uint16Array(length).fill(2000),
  scl: new Uint8Array(length).fill(4),
};
const after = {
  red: new Uint16Array(length).fill(4000),
  nir: new Uint16Array(length).fill(6000),
  green: new Uint16Array(length).fill(2000),
  scl: new Uint8Array(length).fill(4),
};
before.scl[0] = 9;
after.scl[1] = 8;
before.red[2] = 0;
const summary = summarizeCommonPixels(before, after, aoiMask);
assert.equal(summary.commonValid, 7);
assert.equal(summary.validPct, 70);
assert.equal(summary.quorumMet, true);
assert.equal(summary.stats.vegetationLoss, 7, 'trend counts use only common-valid pixels');
assert.equal(summary.stats.vegetationBefore, 7);
assert.equal(summary.stats.vegetationAfter, 0);

const belowQuorum = summarizeCommonPixels(before, after, Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, 0]));
assert.equal(belowQuorum.totalAoiPixels, 9);
assert.equal(belowQuorum.quorumMet, false);
assert.equal(belowQuorum.stats, null, 'below-quorum pairs expose no change calculation');
assert.equal(haFromPx(100), 1);

console.log('Phase 3 helper tests passed.');
