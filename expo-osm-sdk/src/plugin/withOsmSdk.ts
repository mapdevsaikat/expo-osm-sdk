import {
  ConfigPlugin,
  withPlugins,
  withInfoPlist,
  withAndroidManifest,
  withGradleProperties,
  withAppBuildGradle,
} from '@expo/config-plugins';
import { OsmSdkPluginProps } from './index';

// Main plugin implementation
export const withOsmSdk: ConfigPlugin<OsmSdkPluginProps> = (config, props = {}) => {
  return withPlugins(config, [
    // iOS configuration
    [withOsmSdkIOS, props],
    // Android configuration
    [withOsmSdkAndroid, props],
    // Permissions
    [withOsmSdkPermissions, props],
  ]);
};

// iOS configuration
const withOsmSdkIOS: ConfigPlugin<OsmSdkPluginProps> = (config, props) => {
  return withInfoPlist(config, (config) => {
    // Add location permission description
    config.modResults.NSLocationWhenInUseUsageDescription = 
      props.locationPermissionText || 'This app uses location for map features';
    
    // Add MapLibre configuration
    config.modResults.MGLMapboxAccessToken = '';
    config.modResults.MGLMapboxMetricsEnabledSettingShownInApp = false;
    
    return config;
  });
};

// Android configuration
const withOsmSdkAndroid: ConfigPlugin<OsmSdkPluginProps> = (config, props) => {
  // Add Android manifest permissions
  config = withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    
    // Add location permissions
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    
    const permissions = [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
    ];
    
    permissions.forEach(permission => {
      if (!manifest['uses-permission']?.find(p => p.$['android:name'] === permission)) {
        manifest['uses-permission']?.push({
          $: { 'android:name': permission }
        });
      }
    });
    
    return config;
  });
  
  // Add Gradle properties
  config = withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'expo.modules.osmsdk.enabled',
      value: 'true',
    });
    
    return config;
  });
  
  // Add MapLibre dependency to app build.gradle
  config = withAppBuildGradle(config, (config) => {
    // Note: MapLibre is available on Maven Central, so no additional repositories needed
    // The expo-osm-sdk module's build.gradle already handles the dependency configuration
    return config;
  });
  
  return config;
};

// Permissions configuration
const withOsmSdkPermissions: ConfigPlugin<OsmSdkPluginProps> = (config, props) => {
  // iOS permissions are handled in withOsmSdkIOS
  // Android permissions are handled in withOsmSdkAndroid
  return config;
}; 