// @ts-check
const {
  withAndroidManifest,
  withInfoPlist,
  AndroidConfig,
} = require('@expo/config-plugins');

/**
 * @typedef {Object} ExpoOsmSdkPluginOptions
 *
 * @property {string} [locationWhenInUseDescription]
 *   iOS: Shown to the user when the app asks for "When In Use" location access.
 *   Default: "This app uses your location to show it on the map."
 *
 * @property {string} [locationAlwaysDescription]
 *   iOS: Shown when the app asks for background ("Always") location access.
 *   Only needed if you use background location tracking.
 *   Default: not set (background location not requested).
 *
 * @property {boolean} [enableBackgroundLocation]
 *   Enables background (screen-off) location tracking, used together with
 *   `startLocationTracking({ background: true })`.
 *   Android: Adds ACCESS_BACKGROUND_LOCATION plus FOREGROUND_SERVICE and
 *   FOREGROUND_SERVICE_LOCATION (required on Android 9+/14+ for the SDK's
 *   location foreground service — the service itself is declared in the
 *   SDK's own manifest and merged automatically).
 *   iOS: Adds NSLocationAlwaysAndWhenInUseUsageDescription and the
 *   `location` UIBackgroundMode.
 *   Only enable if your app tracks location in the background — Play Store
 *   review flags apps that declare these permissions without an in-app
 *   disclosure of background location use.
 *   Default: false.
 *
 * @property {boolean} [enableFineLocation]
 *   Android: Adds ACCESS_FINE_LOCATION (GPS-level precision).
 *   Default: true.
 *
 * @property {boolean} [enableCoarseLocation]
 *   Android: Adds ACCESS_COARSE_LOCATION (network-level precision).
 *   Default: true.
 *
 * @property {boolean} [allowCleartextTraffic]
 *   Android: Allows HTTP (non-HTTPS) tile sources.
 *   Default: false. Only enable if you are using a custom HTTP tile server.
 *
 * @property {boolean} [enableTrackExport]
 *   Android: Adds WRITE_EXTERNAL_STORAGE (maxSdkVersion 28) and
 *   READ_EXTERNAL_STORAGE (maxSdkVersion 32) so a GPX track built with
 *   `useLocationTracking`'s `exportTrackAsGpx()` can be written to shared
 *   storage and shared/saved by the user (e.g. via `expo-file-system` +
 *   `expo-sharing`). Map tiles never need this — only enable it if your app
 *   lets users export or download recorded GPS tracks.
 *   iOS needs no extra entitlement for this (the share sheet handles it).
 *   Default: false.
 */

/**
 * Main config plugin for expo-osm-sdk.
 *
 * Usage in app.json:
 * ```json
 * {
 *   "expo": {
 *     "plugins": [
 *       ["expo-osm-sdk/plugin", {
 *         "locationWhenInUseDescription": "Used to show your position on the map.",
 *         "enableBackgroundLocation": false,
 *         "enableTrackExport": false
 *       }]
 *     ]
 *   }
 * }
 * ```
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @param {ExpoOsmSdkPluginOptions} [options]
 * @returns {import('@expo/config-plugins').ExpoConfig}
 */
const withExpoOsmSdk = (config, options = {}) => {
  const {
    locationWhenInUseDescription = 'This app uses your location to show it on the map.',
    locationAlwaysDescription,
    enableBackgroundLocation = false,
    enableFineLocation = true,
    enableCoarseLocation = true,
    allowCleartextTraffic = false,
    enableTrackExport = false,
  } = options;

  // ─── Android: permissions via AndroidConfig.Permissions API ─────────────────
  const androidPermissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
  ];
  if (enableFineLocation) {
    androidPermissions.push('android.permission.ACCESS_FINE_LOCATION');
  }
  if (enableCoarseLocation) {
    androidPermissions.push('android.permission.ACCESS_COARSE_LOCATION');
  }
  if (enableBackgroundLocation) {
    androidPermissions.push('android.permission.ACCESS_FINE_LOCATION');
    androidPermissions.push('android.permission.ACCESS_BACKGROUND_LOCATION');
    // Required for the SDK's LocationTrackingService (screen-off tracking):
    // FOREGROUND_SERVICE since Android 9, FOREGROUND_SERVICE_LOCATION since
    // Android 14. The service declaration itself lives in the SDK's own
    // AndroidManifest.xml and is merged into the app manifest automatically.
    androidPermissions.push('android.permission.FOREGROUND_SERVICE');
    androidPermissions.push('android.permission.FOREGROUND_SERVICE_LOCATION');
  }

  config = AndroidConfig.Permissions.withPermissions(config, androidPermissions);

  // ─── Android: keep MainActivity alive on rotation (MapLibre resize) ─────────
  config = withAndroidManifest(config, (cfg) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(cfg.modResults);
    const existing = mainActivity.$['android:configChanges'] || '';
    const required = ['orientation', 'screenSize', 'screenLayout'];
    const parts = new Set(existing.split('|').filter(Boolean));
    for (const flag of required) {
      parts.add(flag);
    }
    mainActivity.$['android:configChanges'] = [...parts].join('|');
    return cfg;
  });

  // ─── Android: cleartext traffic (HTTP tile servers) ──────────────────────────
  if (allowCleartextTraffic) {
    config = withAndroidManifest(config, (cfg) => {
      const manifest = cfg.modResults.manifest;
      if (manifest.application?.[0]?.$) {
        manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
      }
      return cfg;
    });
  }

  // ─── Android: storage permissions for GPX track export ─────────────────────
  // Map tiles are cached in app-private storage and never need these. They're
  // only added when the app opts in to exporting/downloading GPS tracks.
  if (enableTrackExport) {
    config = withAndroidManifest(config, (cfg) => {
      const manifest = cfg.modResults.manifest;
      if (!manifest['uses-permission']) {
        manifest['uses-permission'] = [];
      }
      const permissions = manifest['uses-permission'];
      const addScopedPermission = (name, maxSdkVersion) => {
        if (permissions.some((p) => p.$['android:name'] === name)) {
          return;
        }
        permissions.push({
          $: { 'android:name': name, 'android:maxSdkVersion': String(maxSdkVersion) },
        });
      };
      // Scoped storage (API 29+) removed the need for broad write access;
      // only pre-Android 10 devices need this to save files outside the
      // app's own directory.
      addScopedPermission('android.permission.WRITE_EXTERNAL_STORAGE', 28);
      // GPX files are written by this app and shared via a share sheet, so
      // no broad READ_MEDIA_* permission is needed on API 33+.
      addScopedPermission('android.permission.READ_EXTERNAL_STORAGE', 32);
      return cfg;
    });
  }

  // ─── iOS: Info.plist ─────────────────────────────────────────────────────────
  config = withInfoPlist(config, (cfg) => {
    const plist = cfg.modResults;

    // Required for "When In Use" location (user location dot on map)
    if (!plist.NSLocationWhenInUseUsageDescription) {
      plist.NSLocationWhenInUseUsageDescription = locationWhenInUseDescription;
    }

    // Background location — only if explicitly enabled
    if (enableBackgroundLocation) {
      const alwaysDesc = locationAlwaysDescription || locationWhenInUseDescription;

      if (!plist.NSLocationAlwaysAndWhenInUseUsageDescription) {
        plist.NSLocationAlwaysAndWhenInUseUsageDescription = alwaysDesc;
      }
      if (!plist.NSLocationAlwaysUsageDescription) {
        plist.NSLocationAlwaysUsageDescription = alwaysDesc;
      }

      if (!plist.UIBackgroundModes) {
        plist.UIBackgroundModes = [];
      }
      if (!plist.UIBackgroundModes.includes('location')) {
        plist.UIBackgroundModes.push('location');
      }
    }

    return cfg;
  });

  return config;
};

module.exports = withExpoOsmSdk;
