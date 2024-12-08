import { ConfigPlugin, WarningAggregator } from "@expo/config-plugins";

import { getShareExtensionName } from "./ios/constants";
import { Parameters } from "./types";
import packageInfo from "../../package.json";

let alreayCheck = false;

export const withCompatibilityChecker: ConfigPlugin<Parameters> = (
  config,
  params,
) => {
  if (alreayCheck) return config;
  alreayCheck = true;
  // CROSS PLATFORM
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

  if (!params.disableIOS) {
    if (params.experimentialIosCustomView) {
      WarningAggregator.addWarningAndroid(
        packageInfo.name,
        `Configuring EXPERIMENTAL build for ios share extension CUSTOM VIEW! (not compatible with new architecture)`,
      );
    }

    // IOS
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
        (appExtension: any) =>
          appExtension.targetName === getShareExtensionName(params),
      );
    if (extraAppExtension && extraAppExtension.length > 1) {
      throw new Error(
        `[${packageInfo.name}] Incompatibility found, you have more than one appExtensions for "${getShareExtensionName(params)}" (${extraAppExtension.length}). Please remove all "eas.build.experimental.ios.appExtensions" with targetName "${getShareExtensionName(params)}" in your app.json! (see https://github.com/achorein/expo-share-intent?tab=readme-ov-file#ios-extension-target)`,
      );
    }

    if (params.iosAppGroupIdentifier?.includes(" ")) {
      throw new Error(
        `[${packageInfo.name}] Incompatibility found, iosAppGroupIdentifier should not contains spaces or special characters"${getShareExtensionName(params)}" in your app.json!`,
      );
    }
  } else {
    console.warn(`[expo-share-intent] IOS module disabled`);
  }

  return config;
};
