import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";

import {
  getShareExtensionBundledIdentifier,
  getShareExtensionName,
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
    const extensionName = getShareExtensionName(parameters);
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    const scheme = config.scheme! as string;
    const appIdentifier = config.ios?.bundleIdentifier!;
    const shareExtensionIdentifier = getShareExtensionBundledIdentifier(
      appIdentifier,
      parameters,
    );
    const currentProjectVersion = config.ios!.buildNumber || "1";
    const marketingVersion = config.version!;

    // ShareExtension-Info.plist
    const infoPlistFilePath = getShareExtensionInfoFilePath(
      platformProjectRoot,
      parameters,
    );
    // ShareExtension.entitlements
    const entitlementsFilePath = getShareExtensionEntitlementsFilePath(
      platformProjectRoot,
      parameters,
    );
    // ShareViewController.swift
    const viewControllerFilePath = getShareExtensionViewControllerPath(
      platformProjectRoot,
      parameters,
    );
    // MainInterface.storyboard
    const storyboardFilePath = getShareExtensionStoryboardFilePath(
      platformProjectRoot,
      parameters,
    );
    // PrivacyInfo.xcprivacy
    const privacyFilePath = getPrivacyInfoFilePath(
      platformProjectRoot,
      parameters,
    );

    await writeShareExtensionFiles(
      platformProjectRoot,
      scheme,
      appIdentifier,
      parameters,
      config.name,
    );

    const pbxProject = config.modResults;

    // Check if the extension target already exists. If so, abort the process since the steps below are already done.
    if (!!pbxProject.pbxTargetByName(extensionName)) {
      return config;
    }

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
    try {
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
    } catch (e: any) {
      if (e.message.includes("reading 'path'")) {
        console.error(e);
        throw new Error(
          `[expo-share-intent] Could not add resource files to the Share Extension, please check your "patch-package" installation for xcode (see: https://github.com/achorein/expo-share-intent?tab=readme-ov-file#installation)`,
        );
      }
      throw e;
    }

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

    if (parameters.experimentialIosCustomView) {
      // Make extension build dependent of maain app target (react build)
      if (!pbxProject.hash.project.objects["PBXTargetDependency"]) {
        pbxProject.hash.project.objects["PBXTargetDependency"] = {};
      }
      if (!pbxProject.hash.project.objects["PBXContainerItemProxy"]) {
        pbxProject.hash.project.objects["PBXContainerItemProxy"] = {};
      }
      pbxProject.addTargetDependency(pbxProject.getFirstTarget().uuid, [
        target.uuid,
      ]);

      // Add shell script build phase "Start Packager" (jsbundle)
      pbxProject.addBuildPhase(
        [],
        "PBXShellScriptBuildPhase",
        "Start Packager",
        target.uuid,
        {
          shellPath: "/bin/sh",
          shellScript:
            'export RCT_METRO_PORT="${RCT_METRO_PORT:=8081}"\necho "export RCT_METRO_PORT=${RCT_METRO_PORT}" > "${SRCROOT}/../node_modules/react-native/scripts/.packager.env"\nif [ -z "${RCT_NO_LAUNCH_PACKAGER+xxx}" ] ; then\n  if nc -w 5 -z localhost ${RCT_METRO_PORT} ; then\n    if ! curl -s "http://localhost:${RCT_METRO_PORT}/status" | grep -q "packager-status:running" ; then\n      echo "Port ${RCT_METRO_PORT} already in use, packager is either not running or not running correctly"\n      exit 2\n    fi\n  else\n    open "$SRCROOT/../node_modules/react-native/scripts/launchPackager.command" || echo "Can\'t start packager automatically"\n  fi\nfi\n',
        },
      );

      // Add shell script build phase
      const mainEntry = "index.js";
      pbxProject.addBuildPhase(
        [],
        "PBXShellScriptBuildPhase",
        "Bundle React Native code and images",
        target.uuid,
        {
          shellPath: "/bin/sh",
          shellScript: `set -e; NODE_BINARY=\${NODE_BINARY:-node}; REACT_NATIVE_SCRIPTS_PATH=$("$NODE_BINARY" --print "require(\\'path\\').dirname(require.resolve(\\'react-native/package.json\\')) + \\'/scripts\\'"); WITH_ENVIRONMENT="$REACT_NATIVE_SCRIPTS_PATH/xcode/with-environment.sh"; REACT_NATIVE_XCODE="$REACT_NATIVE_SCRIPTS_PATH/react-native-xcode.sh"; export ENTRY_FILE=${mainEntry}; /bin/sh -c "$WITH_ENVIRONMENT $REACT_NATIVE_XCODE";`,
        },
      );
    }

    return config;
  });
};
