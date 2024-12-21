import { Parameters } from "../types";

const shareExtensionName = "ShareExtension";

export const shareExtensionInfoFileName = `${shareExtensionName}-Info.plist`;
export const shareExtensionEntitlementsFileName = `${shareExtensionName}.entitlements`;
export const shareExtensionStoryBoardFileName = "MainInterface.storyboard";
export const shareExtensionViewControllerFileName = "ShareViewController.swift";
export const shareExtensionPreprocessorFileName =
  "ShareExtensionPreprocessor.js";

export const getShareExtensionName = (parameters?: Parameters) => {
  if (!parameters?.iosShareExtensionName) return shareExtensionName;
  return parameters.iosShareExtensionName.replace(/[^a-zA-Z0-9]/g, "");
};

export const getAppGroup = (identifier: string, parameters: Parameters) => {
  return parameters.iosAppGroupIdentifier || `group.${identifier}`;
};

export const getShareExtensionBundledIdentifier = (
  appIdentifier: string,
  parameters: Parameters,
) => {
  return (
    parameters.iosShareExtensionBundleIdentifier ||
    `${appIdentifier}.share-extension`
  );
};
