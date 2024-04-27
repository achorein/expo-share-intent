import { ConfigPlugin } from "@expo/config-plugins";

import {
  getShareExtensionBundledIdentifier,
  shareExtensionName,
} from "./constants";
import { getShareExtensionEntitlements } from "./writeIosShareExtensionFiles";
import { Parameters } from "../types";

export const withShareExtensionConfig: ConfigPlugin<Parameters> = (
  config,
  params,
) => {
  const extName = shareExtensionName;
  const appIdentifier = config.ios!.bundleIdentifier!;
  const shareExtensionIdentifier =
    getShareExtensionBundledIdentifier(appIdentifier);

  // When disabled this function no longer alters the config object passed to it
  // It only returns the original config to satisfy any calling conventions
  if (!params.disableExperimental) {
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
      extConfigIndex = 0;
    }

    const extConfig =
      config.extra.eas.build.experimental.ios.appExtensions[extConfigIndex];
    extConfig.entitlements = {
      ...extConfig.entitlements,
      ...getShareExtensionEntitlements(appIdentifier),
    };
  }

  // Assume config.extra.eas is already correctly configured outside this plugin
  // and should not be modified here.
  // Initialize necessary local variables for setup but do not alter config
  // let appExtensions = [
  //   {
  //     targetName: extName,
  //     bundleIdentifier: shareExtensionIdentifier,
  //     entitlements: getShareExtensionEntitlements(appIdentifier),
  //   },
  // ];

  return config;
};
