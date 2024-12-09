import { ConfigPlugin } from "@expo/config-plugins";

import {
  getShareExtensionBundledIdentifier,
  shareExtensionName,
} from "./constants";
import { getShareExtensionEntitlements } from "./writeIosShareExtensionFiles";
import { Parameters } from "../types";

export const withShareExtensionConfig: ConfigPlugin<Parameters> = (
  config,
  parameters,
) => {
  const extName = shareExtensionName;
  const appIdentifier = config.ios!.bundleIdentifier!;
  const shareExtensionIdentifier = getShareExtensionBundledIdentifier(
    appIdentifier,
    parameters,
  );

  // When disabled this function no longer alters the config object passed to it
  // It only returns the original config to satisfy any calling conventions
  if (!parameters.disableExperimental) {
    let extConfigIndex = null;
    config.extra?.eas?.build?.experimental?.ios?.appExtensions?.forEach(
      (ext: any, index: number) => {
        ext.targetName === extName && (extConfigIndex = index);
      },
    );

    if (!config.extra) {
      config.extra = {};
    }

    if (!extConfigIndex) {
      if (!config.extra.eas) {
        config.extra.eas = {};
      }
      if (!config.extra.eas.build) {
        config.extra.eas.build = {};
      }
      if (!config.extra.eas.build.experimental) {
        config.extra.eas.build.experimental = {};
      }
      if (!config.extra.eas.build.experimental.ios) {
        config.extra.eas.build.experimental.ios = {};
      }
      if (!config.extra.eas.build.experimental.ios.appExtensions) {
        config.extra.eas.build.experimental.ios.appExtensions = [];
      }
      config.extra.eas.build.experimental.ios.appExtensions.push({
        targetName: extName,
        bundleIdentifier: shareExtensionIdentifier,
      });
      extConfigIndex =
        config.extra.eas.build.experimental.ios.appExtensions.length - 1;
    }

    const extConfig =
      config.extra.eas.build.experimental.ios.appExtensions[extConfigIndex];
    extConfig.entitlements = {
      ...extConfig.entitlements,
      ...getShareExtensionEntitlements(appIdentifier, parameters),
    };
  } else {
    console.debug(`[expo-share-intent] experimental config disabled`);
  }

  return config;
};
