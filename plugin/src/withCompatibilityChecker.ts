import { ConfigPlugin, WarningAggregator } from "@expo/config-plugins";

import packageInfo from "../../package.json";

let alreayCheck = false;

export const withCompatibilityChecker: ConfigPlugin = (config) => {
  if (alreayCheck) return config;
  alreayCheck = true;
  if (
    !config.sdkVersion?.includes(
      packageInfo.peerDependencies.expo.replace("^", ""),
    )
  ) {
    WarningAggregator.addWarningAndroid(
      packageInfo.name,
      `your Expo SDK version does not match requirements! v${packageInfo.version} needs ${packageInfo.peerDependencies.expo}, found ${config.sdkVersion}. Please refer to the compatibility table.`,
      `${packageInfo.homepage}#versioning`,
    );
  }
  return config;
};
