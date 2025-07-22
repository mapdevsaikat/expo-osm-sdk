const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withExpoOsmSdk = (config) => {
  // Add Android permissions and configurations
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    
    // Add internet permission for map tiles
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    
    const internetPermission = {
      $: { 'android:name': 'android.permission.INTERNET' }
    };
    
    if (!androidManifest.manifest['uses-permission'].find(p => 
      p.$['android:name'] === 'android.permission.INTERNET'
    )) {
      androidManifest.manifest['uses-permission'].push(internetPermission);
    }
    
    return config;
  });

  // Add iOS configurations
  config = withInfoPlist(config, (config) => {
    // Add location usage description if not present
    if (!config.modResults.NSLocationWhenInUseUsageDescription) {
      config.modResults.NSLocationWhenInUseUsageDescription = 
        'This app uses location to show your position on the map.';
    }
    
    return config;
  });

  return config;
};

module.exports = withExpoOsmSdk; 