import { ConfigPlugin, withEntitlementsPlist } from "@expo/config-plugins";

import { getAppGroup } from "./constants";
import { Parameters } from "../types";

export const withAppEntitlements: ConfigPlugin<Parameters> = (
  config,
  parameters,
) => {
  return withEntitlementsPlist(config, async (config) => {
    const appIdentifier = config.ios?.bundleIdentifier!;
    const existing = config.modResults[
      "com.apple.security.application-groups"
    ];
    config.modResults["com.apple.security.application-groups"] = [
      getAppGroup(appIdentifier, parameters),
      ...(Array.isArray(existing) ? existing : []),
    ];
    return config;
  });
};
