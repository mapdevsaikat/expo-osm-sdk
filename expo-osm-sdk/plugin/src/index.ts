import { ConfigPlugin, createRunOncePlugin, withInfoPlist, withAndroidManifest } from '@expo/config-plugins';

const LOCATION_USAGE = 'This app uses location to show your position on the map';

interface PluginOptions {
  locationPermissionText?: string;
}

const withOSMSdk: ConfigPlugin<PluginOptions> = (config, options = {}) => {
  // iOS: Add NSLocationWhenInUseUsageDescription to Info.plist
  config = withInfoPlist(config, (config) => {
    const locationText = options.locationPermissionText || LOCATION_USAGE;
    config.modResults.NSLocationWhenInUseUsageDescription = locationText;
    config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription = locationText;
    return config;
  });

  // Android: Add location permissions to AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const permissions = manifest.manifest?.['uses-permission'] || [];
    
    const requiredPermissions = [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.INTERNET'
    ];

    for (const permission of requiredPermissions) {
      const exists = permissions.some((p: any) => p.$?.['android:name'] === permission);
      if (!exists) {
        permissions.push({
          $: {
            'android:name': permission
          }
        });
      }
    }

    manifest.manifest!['uses-permission'] = permissions;
    return config;
  });

  return config;
};

export default createRunOncePlugin(withOSMSdk, 'expo-osm-sdk', '1.0.0'); 