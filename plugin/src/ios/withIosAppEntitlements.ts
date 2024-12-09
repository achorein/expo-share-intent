import { ConfigPlugin, withEntitlementsPlist } from "@expo/config-plugins";

import { getAppGroup } from "./constants";
import { Parameters } from "../types";

export const withAppEntitlements: ConfigPlugin<Parameters> = (
  config,
  parameters,
) => {
  return withEntitlementsPlist(config, async (config) => {
    const appIdentifier = config.ios?.bundleIdentifier!;
    config.modResults["com.apple.security.application-groups"] = [
      getAppGroup(appIdentifier, parameters),
    ];
    return config;
  });
};
