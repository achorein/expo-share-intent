import { Parameters } from "../types";

export const shareExtensionName = "ShareExtension";

export const shareExtensionInfoFileName = `${shareExtensionName}-Info.plist`;
export const shareExtensionEntitlementsFileName = `${shareExtensionName}.entitlements`;
export const shareExtensionStoryBoardFileName = "MainInterface.storyboard";
export const shareExtensionViewControllerFileName = "ShareViewController.swift";

export const getShareExtensionName = (parameters?: Parameters) =>
  parameters?.iosShareExtensionName || "ShareExtension";

export const getAppGroup = (identifier: string, parameters: Parameters) => {
  return parameters.iosAppGroupIdentifier || `group.${identifier}`;
};

export const getShareExtensionBundledIdentifier = (appIdentifier: string) =>
  `${appIdentifier}.share-extension`;
