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
 *   Android: Allows HTTP (non-HTTPS) tile sources.
 *   Default: false. Only enable if you are using a custom HTTP tile server.
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
  }

  config = AndroidConfig.Permissions.withPermissions(config, androidPermissions);

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
