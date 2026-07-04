# expo-osm-sdk Benchmarks

Reproducible performance numbers for the JavaScript layer of `expo-osm-sdk@2.2.0`.

- **Generated:** 2026-07-04T10:07:41.431Z
- **Node:** v22.21.1
- **OS:** Darwin 25.5.0 arm64
- **CPU:** Apple M5

Regenerate with:

```bash
npm run benchmark
```

## Methodology

- Benchmarks run against the compiled `build/` output — the exact code published to npm.
- Per-op benchmarks warm up for 1,000 iterations, then run 10,000-op batches for at least 500 ms; ops/sec is derived from the mean batch time.
- Batch scenarios (marker sanitization) measure end-to-end wall time over the whole array, repeated 50-200 times.
- Native map rendering (MapLibre GL) is not measured here; it runs off the JS thread. These numbers cover the SDK's JS overhead: validation, sanitization, and geospatial math that run on every prop update or location tick.

## Coordinate operations

| Benchmark | Ops/sec | Mean (µs/op) | p95 (µs/op) |
| --- | ---: | ---: | ---: |
| isValidCoordinate (valid input) | 406,462,546 | 0.002 | 0.003 |
| isValidCoordinate (invalid input) | 423,705,447 | 0.002 | 0.002 |
| validateCoordinate (valid input) | 161,027,276 | 0.006 | 0.013 |
| calculateDistance (NYC -> variable) | 38,952,179 | 0.026 | 0.029 |
| calculateBearing (NYC -> variable) | 28,990,491 | 0.034 | 0.038 |

## Overlay sanitization

The always-on safety filter that skips invalid markers/shapes before they
reach the native layer. This is the SDK's per-render overhead for the
`markers` prop (memoized - it only reruns when the array identity changes).

| Scenario | Mean (ms) | p50 (ms) | p95 (ms) |
| --- | ---: | ---: | ---: |
| sanitize 100 markers (all valid) | 0.002 | 0.002 | 0.003 |
| sanitize 1,000 markers (all valid) | 0.013 | 0.01 | 0.012 |
| sanitize 10,000 markers (all valid) | 0.103 | 0.101 | 0.113 |
| sanitize 10,000 markers (10% invalid) | 0.105 | 0.101 | 0.125 |

## Geofencing

| Benchmark | Ops/sec | Mean (µs/op) | p95 (µs/op) |
| --- | ---: | ---: | ---: |
| isPointInCircle (5km radius) | 50,032,312 | 0.02 | 0.022 |
| isPointInPolygon (12 vertices) | 26,441,684 | 0.038 | 0.041 |
| isPointInPolygon (100 vertices) | 3,647,872 | 0.274 | 0.284 |
| isPointInGeofence (circle) | 42,948,775 | 0.023 | 0.042 |
| isPointInGeofence (polygon) | 26,017,788 | 0.038 | 0.046 |

## Memory

| Scenario | Wall time (ms) | Heap delta (MB) |
| --- | ---: | ---: |
| create + sanitize 10x 10,000 markers | 6.4 | 0 |



## Interpreting the numbers

- Sanitizing even 10,000 markers stays in the low-millisecond range, so the
  always-on validation added in v2.2.0 has negligible impact on render time.
- Coordinate validation runs in well under a microsecond per call - safe to
  call on every location update.
- Machine-readable results are written to `benchmark-results.json` for
  regression tracking in CI.
