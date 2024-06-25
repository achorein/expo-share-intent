import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";

import {
  getShareExtensionBundledIdentifier,
  shareExtensionName,
} from "./constants";
import {
  getPrivacyInfoFilePath,
  getShareExtensionEntitlementsFilePath,
  getShareExtensionInfoFilePath,
  getShareExtensionStoryboardFilePath,
  getShareExtensionViewControllerPath,
  writeShareExtensionFiles,
} from "./writeIosShareExtensionFiles";
import { Parameters } from "../types";

export const withShareExtensionXcodeTarget: ConfigPlugin<Parameters> = (
  config,
  parameters,
) => {
  return withXcodeProject(config, async (config) => {
    const extensionName = shareExtensionName;
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    const scheme = config.scheme! as string;
    const appIdentifier = config.ios?.bundleIdentifier!;
    const shareExtensionIdentifier =
      getShareExtensionBundledIdentifier(appIdentifier);
    const currentProjectVersion = config.ios!.buildNumber || "1";
    const marketingVersion = config.version!;

    // ShareExtension-Info.plist
    const infoPlistFilePath =
      getShareExtensionInfoFilePath(platformProjectRoot);
    // ShareExtension.entitlements
    const entitlementsFilePath =
      getShareExtensionEntitlementsFilePath(platformProjectRoot);
    // ShareViewController.swift
    const viewControllerFilePath =
      getShareExtensionViewControllerPath(platformProjectRoot);
    // MainInterface.storyboard
    const storyboardFilePath =
      getShareExtensionStoryboardFilePath(platformProjectRoot);
    // PrivacyInfo.xcprivacy
    const privacyFilePath = getPrivacyInfoFilePath(platformProjectRoot);

    await writeShareExtensionFiles(
      platformProjectRoot,
      scheme,
      appIdentifier,
      parameters,
      config.name,
    );

    const pbxProject = config.modResults;

    const target = pbxProject.addTarget(
      extensionName,
      "app_extension",
      extensionName,
    );

    // Add a new PBXSourcesBuildPhase for our ShareViewController
    // (we can't add it to the existing one because an extension is kind of an extra app)
    pbxProject.addBuildPhase(
      [],
      "PBXSourcesBuildPhase",
      "Sources",
      target.uuid,
    );

    // Add a new PBXResourcesBuildPhase for the Resources used by the Share Extension
    pbxProject.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      target.uuid,
    );

    // Create a separate PBXGroup for the shareExtension's files
    const pbxGroupKey = pbxProject.pbxCreateGroup(extensionName, extensionName);

    // Add files which are not part of any build phase (ShareExtension-Info.plist)
    pbxProject.addFile(infoPlistFilePath, pbxGroupKey);

    // Add source files to our PbxGroup and our newly created PBXSourcesBuildPhase (ShareViewController.swift)
    pbxProject.addSourceFile(
      viewControllerFilePath,
      { target: target.uuid },
      pbxGroupKey,
    );

    // Add the resource file and include it into the target PbxResourcesBuildPhase and PbxGroup
    // (MainInterface.storyboard / PrivacyInfo.xcprivacy)
    pbxProject.addResourceFile(
      storyboardFilePath,
      { target: target.uuid },
      pbxGroupKey,
    );
    pbxProject.addResourceFile(
      privacyFilePath,
      { target: target.uuid },
      pbxGroupKey,
    );

    const configurations = pbxProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      if (typeof configurations[key].buildSettings !== "undefined") {
        const buildSettingsObj = configurations[key].buildSettings;
        if (
          typeof buildSettingsObj["PRODUCT_NAME"] !== "undefined" &&
          buildSettingsObj["PRODUCT_NAME"] === `"${extensionName}"`
        ) {
          buildSettingsObj["CLANG_ENABLE_MODULES"] = "YES";
          buildSettingsObj["INFOPLIST_FILE"] = `"${infoPlistFilePath}"`;
          buildSettingsObj["CODE_SIGN_ENTITLEMENTS"] =
            `"${entitlementsFilePath}"`;
          buildSettingsObj["CODE_SIGN_STYLE"] = "Automatic";
          buildSettingsObj["CURRENT_PROJECT_VERSION"] =
            `"${currentProjectVersion}"`;
          buildSettingsObj["GENERATE_INFOPLIST_FILE"] = "YES";
          buildSettingsObj["MARKETING_VERSION"] = `"${marketingVersion}"`;
          buildSettingsObj["PRODUCT_BUNDLE_IDENTIFIER"] =
            `"${shareExtensionIdentifier}"`;
          buildSettingsObj["SWIFT_EMIT_LOC_STRINGS"] = "YES";
          buildSettingsObj["SWIFT_VERSION"] = "5.0";
          buildSettingsObj["TARGETED_DEVICE_FAMILY"] = `"1,2"`;
        }
      }
    }

    return config;
  });
};
