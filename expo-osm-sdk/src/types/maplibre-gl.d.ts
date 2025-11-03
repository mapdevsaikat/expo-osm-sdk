/**
 * Minimal type declaration for maplibre-gl (optional peer dependency)
 * This allows TypeScript compilation to succeed even when maplibre-gl is not installed
 */
declare module 'maplibre-gl' {
  const maplibregl: any;
  export default maplibregl;
  export const Map: any;
  export const Marker: any;
  export const Popup: any;
  export const NavigationControl: any;
  export const GeolocateControl: any;
  export const ScaleControl: any;
  export const FullscreenControl: any;
}

