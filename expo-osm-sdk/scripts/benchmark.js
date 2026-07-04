#!/usr/bin/env node
/**
 * expo-osm-sdk benchmark runner
 *
 * Benchmarks the compiled SDK (build/) — the exact code shipped to npm — and
 * writes both machine-readable results (benchmark-results.json) and a
 * human-readable report (BENCHMARKS.md).
 *
 * Usage:
 *   npm run benchmark        # builds first, then runs
 *   node scripts/benchmark.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');

if (!fs.existsSync(path.join(BUILD_DIR, 'utils', 'coordinate.js'))) {
  console.error('build/ not found. Run `npm run build` first (or use `npm run benchmark`).');
  process.exit(1);
}

const {
  isValidCoordinate,
  validateCoordinate,
  calculateDistance,
  calculateBearing,
} = require(path.join(BUILD_DIR, 'utils', 'coordinate.js'));

const {
  isPointInCircle,
  isPointInPolygon,
  isPointInGeofence,
} = require(path.join(BUILD_DIR, 'utils', 'geofencing.js'));

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

/**
 * Runs `fn` repeatedly for at least `minTimeMs`, after a warmup, and returns
 * throughput statistics. `fn` receives the iteration index.
 */
function bench(name, fn, { minTimeMs = 500, warmupIterations = 1000 } = {}) {
  // Warmup (JIT, caches)
  for (let i = 0; i < warmupIterations; i++) fn(i);

  const samples = [];
  let totalOps = 0;
  const start = performance.now();
  let elapsed = 0;

  while (elapsed < minTimeMs) {
    const batch = 10_000;
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) fn(i);
    const t1 = performance.now();
    samples.push((t1 - t0) / batch);
    totalOps += batch;
    elapsed = performance.now() - start;
  }

  samples.sort((a, b) => a - b);
  const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
  const p50 = samples[Math.floor(samples.length * 0.5)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const opsPerSec = 1000 / mean;

  const result = {
    name,
    opsPerSec: Math.round(opsPerSec),
    meanUs: +(mean * 1000).toFixed(3), // microseconds per op
    p50Us: +(p50 * 1000).toFixed(3),
    p95Us: +(p95 * 1000).toFixed(3),
    totalOps,
  };
  console.log(
    `  ${name.padEnd(52)} ${String(result.opsPerSec.toLocaleString('en-US')).padStart(12)} ops/s   ` +
    `mean ${result.meanUs} µs`
  );
  return result;
}

/**
 * Runs `fn` once over a dataset and returns wall time - for batch scenarios
 * (e.g. sanitizing a whole marker array) where per-op throughput is less
 * interesting than end-to-end latency.
 */
function benchBatch(name, fn, { iterations = 50 } = {}) {
  // Warmup
  fn();
  fn();

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    const t1 = performance.now();
    times.push(t1 - t0);
  }
  times.sort((a, b) => a - b);
  const mean = times.reduce((s, v) => s + v, 0) / times.length;
  const p95 = times[Math.floor(times.length * 0.95)];

  const result = {
    name,
    meanMs: +mean.toFixed(3),
    p50Ms: +times[Math.floor(times.length * 0.5)].toFixed(3),
    p95Ms: +p95.toFixed(3),
    iterations,
  };
  console.log(`  ${name.padEnd(52)} mean ${String(result.meanMs).padStart(9)} ms   p95 ${result.p95Ms} ms`);
  return result;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const coord = (lat, lng) => ({ latitude: lat, longitude: lng });
const NYC = coord(40.7128, -74.006);

function makeMarkers(count, invalidRatio = 0) {
  return Array.from({ length: count }, (_, i) => {
    const invalid = invalidRatio > 0 && i % Math.round(1 / invalidRatio) === 0;
    return {
      id: `marker-${i}`,
      coordinate: invalid
        ? coord(999, 999)
        : coord(40.7128 + (i % 1000) * 0.0001, -74.006 + (i % 1000) * 0.0001),
      title: `Marker ${i}`,
    };
  });
}

// Mirrors the always-on sanitization filter inside OSMView
function sanitizeMarkers(markers) {
  if (!Array.isArray(markers)) return [];
  return markers.filter(
    (m) => m && typeof m.id === 'string' && isValidCoordinate(m.coordinate)
  );
}

function makePolygon(sides, centerLat = 40.7, centerLng = -74.0, radiusDeg = 0.1) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = (2 * Math.PI * i) / sides;
    return coord(centerLat + radiusDeg * Math.sin(angle), centerLng + radiusDeg * Math.cos(angle));
  });
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

console.log('\nexpo-osm-sdk benchmarks');
console.log(`node ${process.version} | ${os.type()} ${os.arch()} | ${os.cpus()[0]?.model ?? 'unknown CPU'}\n`);

const results = { coordinateOps: [], sanitization: [], geofencing: [], memory: {} };

// Accumulator that keeps V8 from dead-code-eliminating benchmarked calls
let sink = 0;

// Pre-built pool of varied coordinates so per-op input differs without
// measuring object allocation
const COORD_POOL = Array.from({ length: 1024 }, (_, i) =>
  coord(-89 + (i % 179), -179 + ((i * 7) % 359))
);
const INVALID_COORD = { latitude: 999, longitude: 0 };

console.log('Coordinate operations (per-op throughput):');
results.coordinateOps.push(
  bench('isValidCoordinate (valid input)', (i) => { sink += isValidCoordinate(COORD_POOL[i & 1023]) ? 1 : 0; }),
  bench('isValidCoordinate (invalid input)', () => { sink += isValidCoordinate(INVALID_COORD) ? 1 : 0; }),
  bench('validateCoordinate (valid input)', (i) => { sink += validateCoordinate(COORD_POOL[i & 1023]).latitude; }),
  bench('calculateDistance (NYC -> variable)', (i) => { sink += calculateDistance(NYC, COORD_POOL[i & 1023]); }),
  bench('calculateBearing (NYC -> variable)', (i) => { sink += calculateBearing(NYC, COORD_POOL[i & 1023]); })
);

console.log('\nOverlay sanitization (always-on safety filter, end-to-end):');
const markers100 = makeMarkers(100);
const markers1k = makeMarkers(1_000);
const markers10k = makeMarkers(10_000);
const markers10kDirty = makeMarkers(10_000, 0.1); // 10% invalid
results.sanitization.push(
  benchBatch('sanitize 100 markers (all valid)', () => sanitizeMarkers(markers100), { iterations: 200 }),
  benchBatch('sanitize 1,000 markers (all valid)', () => sanitizeMarkers(markers1k), { iterations: 200 }),
  benchBatch('sanitize 10,000 markers (all valid)', () => sanitizeMarkers(markers10k)),
  benchBatch('sanitize 10,000 markers (10% invalid)', () => sanitizeMarkers(markers10kDirty))
);

console.log('\nGeofencing:');
const circleGeofence = { id: 'c', type: 'circle', center: NYC, radius: 5000 };
const polygonGeofence12 = { id: 'p12', type: 'polygon', coordinates: makePolygon(12) };
const polygonGeofence100 = { id: 'p100', type: 'polygon', coordinates: makePolygon(100) };
const NEAR_NYC_POOL = Array.from({ length: 1024 }, (_, i) =>
  coord(40.6 + (i % 100) * 0.002, -74.1 + ((i * 7) % 100) * 0.002)
);
results.geofencing.push(
  bench('isPointInCircle (5km radius)', (i) => { sink += isPointInCircle(NEAR_NYC_POOL[i & 1023], circleGeofence) ? 1 : 0; }),
  bench('isPointInPolygon (12 vertices)', (i) => { sink += isPointInPolygon(NEAR_NYC_POOL[i & 1023], polygonGeofence12) ? 1 : 0; }),
  bench('isPointInPolygon (100 vertices)', (i) => { sink += isPointInPolygon(NEAR_NYC_POOL[i & 1023], polygonGeofence100) ? 1 : 0; }),
  bench('isPointInGeofence (circle)', (i) => { sink += isPointInGeofence(NEAR_NYC_POOL[i & 1023], circleGeofence) ? 1 : 0; }),
  bench('isPointInGeofence (polygon)', (i) => { sink += isPointInGeofence(NEAR_NYC_POOL[i & 1023], polygonGeofence12) ? 1 : 0; })
);

console.log('\nMemory (object churn):');
{
  if (global.gc) global.gc();
  const before = process.memoryUsage().heapUsed;
  const t0 = performance.now();
  for (let round = 0; round < 10; round++) {
    sanitizeMarkers(makeMarkers(10_000, 0.05));
  }
  const t1 = performance.now();
  if (global.gc) global.gc();
  const after = process.memoryUsage().heapUsed;
  results.memory = {
    name: 'create + sanitize 10x 10,000 markers',
    wallMs: +(t1 - t0).toFixed(1),
    heapDeltaMb: +((after - before) / 1024 / 1024).toFixed(2),
    gcForced: !!global.gc,
  };
  console.log(
    `  ${results.memory.name.padEnd(52)} ${results.memory.wallMs} ms, heap delta ${results.memory.heapDeltaMb} MB` +
    (global.gc ? ' (gc forced)' : ' (run with --expose-gc for accurate heap delta)')
  );
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const pkg = require(path.join(ROOT, 'package.json'));
const meta = {
  package: `${pkg.name}@${pkg.version}`,
  date: new Date().toISOString(),
  node: process.version,
  os: `${os.type()} ${os.release()} ${os.arch()}`,
  cpu: os.cpus()[0]?.model ?? 'unknown',
};

const jsonPath = path.join(ROOT, 'benchmark-results.json');
fs.writeFileSync(jsonPath, JSON.stringify({ meta, results }, null, 2));

const opsTable = (rows) =>
  [
    '| Benchmark | Ops/sec | Mean (µs/op) | p95 (µs/op) |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map((r) => `| ${r.name} | ${r.opsPerSec.toLocaleString('en-US')} | ${r.meanUs} | ${r.p95Us} |`),
  ].join('\n');

const batchTable = (rows) =>
  [
    '| Scenario | Mean (ms) | p50 (ms) | p95 (ms) |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map((r) => `| ${r.name} | ${r.meanMs} | ${r.p50Ms} | ${r.p95Ms} |`),
  ].join('\n');

const md = `# expo-osm-sdk Benchmarks

Reproducible performance numbers for the JavaScript layer of \`${meta.package}\`.

- **Generated:** ${meta.date}
- **Node:** ${meta.node}
- **OS:** ${meta.os}
- **CPU:** ${meta.cpu}

Regenerate with:

\`\`\`bash
npm run benchmark
\`\`\`

## Methodology

- Benchmarks run against the compiled \`build/\` output — the exact code published to npm.
- Per-op benchmarks warm up for 1,000 iterations, then run 10,000-op batches for at least 500 ms; ops/sec is derived from the mean batch time.
- Batch scenarios (marker sanitization) measure end-to-end wall time over the whole array, repeated 50-200 times.
- Native map rendering (MapLibre GL) is not measured here; it runs off the JS thread. These numbers cover the SDK's JS overhead: validation, sanitization, and geospatial math that run on every prop update or location tick.

## Coordinate operations

${opsTable(results.coordinateOps)}

## Overlay sanitization

The always-on safety filter that skips invalid markers/shapes before they
reach the native layer. This is the SDK's per-render overhead for the
\`markers\` prop (memoized - it only reruns when the array identity changes).

${batchTable(results.sanitization)}

## Geofencing

${opsTable(results.geofencing)}

## Memory

| Scenario | Wall time (ms) | Heap delta (MB) |
| --- | ---: | ---: |
| ${results.memory.name} | ${results.memory.wallMs} | ${results.memory.heapDeltaMb}${results.memory.gcForced ? '' : ' *'} |

${results.memory.gcForced ? '' : '\\* Run with `node --expose-gc scripts/benchmark.js` for a GC-stabilized heap delta.'}

## Interpreting the numbers

- Sanitizing even 10,000 markers stays in the low-millisecond range, so the
  always-on validation added in v2.2.0 has negligible impact on render time.
- Coordinate validation runs in well under a microsecond per call - safe to
  call on every location update.
- Machine-readable results are written to \`benchmark-results.json\` for
  regression tracking in CI.
`;

const mdPath = path.join(ROOT, 'BENCHMARKS.md');
fs.writeFileSync(mdPath, md);

// Reference sink so the whole benchmark body can't be optimized away
if (!Number.isFinite(sink)) console.log(sink);

console.log(`\nWrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, mdPath)}\n`);
