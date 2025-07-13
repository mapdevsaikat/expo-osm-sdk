import { ConfigPlugin } from '@expo/config-plugins';
import { withOsmSdk } from './withOsmSdk';

// Main plugin configuration
export interface OsmSdkPluginProps {
  locationPermissionText?: string;
  enableGoogleServices?: boolean;
}

// Main plugin export
const withExpoOsmSdk: ConfigPlugin<OsmSdkPluginProps> = (config, props = {}) => {
  return withOsmSdk(config, props);
};

export default withExpoOsmSdk; 