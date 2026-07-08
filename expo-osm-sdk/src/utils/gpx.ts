import type { LocationFix } from '../types';

/** Options for {@link buildGpxTrack}. */
export interface BuildGpxTrackOptions {
  /** Track name written to `<trk><name>`. Default: "Track". */
  trackName?: string;
  /** Creator string written to the `<gpx creator="...">` attribute. */
  creator?: string;
}

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Builds a GPX 1.1 track document from a series of GPS fixes, suitable for
 * writing to a file and sharing/exporting (e.g. via `expo-file-system` +
 * `expo-sharing`).
 *
 * Each fix becomes a `<trkpt>`: latitude/longitude as attributes, altitude
 * as `<ele>`, timestamp as `<time>` (ISO 8601, UTC), and accuracy/bearing/
 * speed as a `<extensions>` block (GPX core has no standard elements for
 * them).
 *
 * Points without a valid `latitude`/`longitude` are skipped.
 *
 * @example
 * ```ts
 * const gpx = buildGpxTrack(trackPoints, { trackName: 'Morning walk' });
 * await FileSystem.writeAsStringAsync(fileUri, gpx);
 * ```
 */
export function buildGpxTrack(
  points: readonly LocationFix[],
  options: BuildGpxTrackOptions = {}
): string {
  const { trackName = 'Track', creator = 'expo-osm-sdk' } = options;

  const trkpts = points
    .filter((p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
    .map((p) => {
      const lines: string[] = [
        `      <trkpt lat="${p.latitude}" lon="${p.longitude}">`
      ];
      if (typeof p.altitude === 'number') {
        lines.push(`        <ele>${p.altitude}</ele>`);
      }
      if (typeof p.timestamp === 'number') {
        lines.push(`        <time>${new Date(p.timestamp).toISOString()}</time>`);
      }
      const hasExtensions =
        typeof p.accuracy === 'number' ||
        typeof p.bearing === 'number' ||
        typeof p.speed === 'number';
      if (hasExtensions) {
        lines.push('        <extensions>');
        if (typeof p.accuracy === 'number') {
          lines.push(`          <accuracy>${p.accuracy}</accuracy>`);
        }
        if (typeof p.bearing === 'number') {
          lines.push(`          <bearing>${p.bearing}</bearing>`);
        }
        if (typeof p.speed === 'number') {
          lines.push(`          <speed>${p.speed}</speed>`);
        }
        lines.push('        </extensions>');
      }
      lines.push('      </trkpt>');
      return lines.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${escapeXml(creator)}" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(trackName)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}
