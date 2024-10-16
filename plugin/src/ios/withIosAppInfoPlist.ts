import { ConfigPlugin, withInfoPlist } from "@expo/config-plugins";

import { getAppGroup } from "./constants";
import { Parameters } from "../types";

export const withIosAppInfoPlist: ConfigPlugin<Parameters> = (
  config,
  parameters,
) => {
  return withInfoPlist(config, (config) => {
    const appIdentifier = config.ios?.bundleIdentifier!;
    config.modResults["AppGroupIdentifier"] = getAppGroup(
      appIdentifier,
      parameters,
    );
    return config;
  });
};
