import { ConfigPlugin, withEntitlementsPlist } from '@expo/config-plugins';

import { getAppGroups } from './constants';

export const withAppEntitlements: ConfigPlugin = (config) => {
  return withEntitlementsPlist(config, async (config) => {
    const appIdentifier = config.ios?.bundleIdentifier!;
    config.modResults['com.apple.security.application-groups'] = getAppGroups(appIdentifier);
    return config;
  });
};
