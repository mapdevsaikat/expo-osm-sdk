// @ts-check
const {
  withAndroidManifest,
  withInfoPlist,
  withAndroidColors,
  withAndroidStyles,
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
 *   Android: Adds ACCESS_BACKGROUND_LOCATION permission.
 *   iOS: Adds NSLocationAlwaysAndWhenInUseUsageDescription.
 *   Only enable if your app tracks location in the background.
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
 *   Android: Allows HTTP (non-HTTPS) tile sources in debug builds.
 *   Default: false. Only enable if you are using a custom HTTP tile server.
 */

/**
 * Ensures a uses-permission entry exists in the Android manifest.
 * @param {any[]} permissions
 * @param {string} name
 */
function addAndroidPermission(permissions, name) {
  if (!permissions.find((p) => p.$?.['android:name'] === name)) {
    permissions.push({ $: { 'android:name': name } });
  }
}

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
 *         "enableBackgroundLocation": false
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
  } = options;

  // ─── Android: Manifest permissions ──────────────────────────────────────────
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = manifest['uses-permission'];

    // Always required — map tiles are fetched over the network
    addAndroidPermission(permissions, 'android.permission.INTERNET');
    addAndroidPermission(permissions, 'android.permission.ACCESS_NETWORK_STATE');

    // Location permissions
    if (enableFineLocation) {
      addAndroidPermission(permissions, 'android.permission.ACCESS_FINE_LOCATION');
    }
    if (enableCoarseLocation) {
      addAndroidPermission(permissions, 'android.permission.ACCESS_COARSE_LOCATION');
    }
    if (enableBackgroundLocation) {
      // Background location requires a foreground permission to already be declared
      addAndroidPermission(permissions, 'android.permission.ACCESS_FINE_LOCATION');
      addAndroidPermission(permissions, 'android.permission.ACCESS_BACKGROUND_LOCATION');
    }

    // Cleartext traffic (HTTP tile servers) — only in application tag
    if (allowCleartextTraffic) {
      if (!manifest.application) {
        manifest.application = [{ $: {} }];
      }
      manifest.application[0].$ = {
        ...manifest.application[0].$,
        'android:usesCleartextTraffic': 'true',
      };
    }

    return cfg;
  });

  // ─── iOS: Info.plist ─────────────────────────────────────────────────────────
  config = withInfoPlist(config, (cfg) => {
    const plist = cfg.modResults;

    // Required for "When In Use" location (user location dot on map)
    if (!plist.NSLocationWhenInUseUsageDescription) {
      plist.NSLocationWhenInUseUsageDescription = locationWhenInUseDescription;
    }

    // Background location — only if explicitly enabled
    if (enableBackgroundLocation) {
      const alwaysDesc =
        locationAlwaysDescription ||
        locationWhenInUseDescription;

      if (!plist.NSLocationAlwaysAndWhenInUseUsageDescription) {
        plist.NSLocationAlwaysAndWhenInUseUsageDescription = alwaysDesc;
      }
      if (!plist.NSLocationAlwaysUsageDescription) {
        plist.NSLocationAlwaysUsageDescription = alwaysDesc;
      }

      // Register the background mode
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
