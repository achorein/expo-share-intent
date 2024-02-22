import { ConfigPlugin } from "@expo/config-plugins";

import {
  getShareExtensionBundledIdentifier,
  shareExtensionName,
} from "./constants";
import { getShareExtensionEntitlements } from "./writeIosShareExtensionFiles";

export const withShareExtensionConfig: ConfigPlugin = (config) => {
  const extName = shareExtensionName;
  const appIdentifier = config.ios!.bundleIdentifier!;
  const shareExtensionIdentifier =
    getShareExtensionBundledIdentifier(appIdentifier);

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

  return config;
};
