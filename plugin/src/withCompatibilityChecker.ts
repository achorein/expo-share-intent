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
  if (!config.scheme) {
    throw new Error(
      `[${packageInfo.name}] Incompatibility found, you must configure a scheme into you app.json file ! (see https://docs.expo.dev/guides/linking/#linking-to-your-app)`,
    );
  }
  const CFBundleURLSchemes = config.ios?.infoPlist?.CFBundleURLTypes?.find(
    (type: any) => type.CFBundleURLSchemes,
  )?.CFBundleURLSchemes;
  if (CFBundleURLSchemes && !CFBundleURLSchemes.includes(config.scheme)) {
    throw new Error(
      `[${packageInfo.name}] Incompatibility found, when you override CFBundleURLSchemes you have to manually add the application scheme ! (ios.infoPlist.CFBundleURLTypes.CFBundleURLSchemes: ${JSON.stringify([...CFBundleURLSchemes, config.scheme])})`,
    );
  }

  const extraAppExtension =
    config.extra?.eas?.build?.experimental?.ios?.appExtensions?.filter(
      (appExtension: any) => appExtension.targetName === "ShareExtension",
    );
  if (extraAppExtension && extraAppExtension.length > 1) {
    throw new Error(
      `[${packageInfo.name}] Incompatibility found, you have more than one appExtensions for "ShareExtension" (${extraAppExtension.length}). Please remove all "eas.build.experimental.ios.appExtensions" with targetName "ShareExtension" in your app.json! (see https://github.com/achorein/expo-share-intent?tab=readme-ov-file#ios-extension-target)`,
    );
  }

  return config;
};
