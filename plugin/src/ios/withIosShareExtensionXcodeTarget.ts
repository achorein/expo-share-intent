import { ConfigPlugin, withXcodeProject } from "@expo/config-plugins";

import {
  getShareExtensionBundledIdentifier,
  getShareExtensionName,
  shareExtensionViewControllerFileName,
  shareExtensionStoryBoardFileName,
  shareExtensionPreprocessorFileName,
  shareExtensionInfoFileName,
  shareExtensionEntitlementsFileName,
} from "./constants";
import { writeShareExtensionFiles } from "./writeIosShareExtensionFiles";
import { Parameters } from "../types";

//───────────────────────────────────────────────────────────────────────────
// Helper: pull DEVELOPMENT_TEAM from the main-app target's build settings
//───────────────────────────────────────────────────────────────────────────
function getMainAppDevelopmentTeam(pbx: any): string | null {
  const configs = pbx.pbxXCBuildConfigurationSection();

  for (const key in configs) {
    const config = configs[key];
    const bs = config.buildSettings;
    if (!bs || !bs.PRODUCT_NAME) continue;

    const productName = bs.PRODUCT_NAME?.replace(/"/g, "");
    // Ignore other extensions/widgets
    if (
      productName &&
      (productName.includes("Extension") || productName.includes("Widget"))
    ) {
      continue;
    }

    const developmentTeam = bs.DEVELOPMENT_TEAM?.replace(/"/g, "");
    if (developmentTeam) {
      console.log(
        `[expo-share-intent] Found DEVELOPMENT_TEAM='${developmentTeam}' from main app configuration.`,
      );
      return developmentTeam;
    }
  }

  console.warn(
    "[expo-share-intent] No DEVELOPMENT_TEAM found in main app build settings. Developer will need to manually add Dev Team.",
  );
  return null;
}

//───────────────────────────────────────────────────────────────────────────
// Helper: move the host app's "Embed App Extensions" phase ahead of its
// run-script build phases to avoid an Xcode build cycle.
//
// `addTarget()` appends the "Embed App Extensions" copy-files phase (which writes
// `<app>.app/PlugIns/<ext>.appex`) to the END of the host target's build phases.
// That places it AFTER run-script phases such as expo-dev-launcher's
// "[Expo Dev Launcher] Strip Local Network Keys for Release", which declares the
// app's Info.plist (inside the .app bundle) as an input and no outputs. Xcode's
// build system then needs the whole bundle assembled before that script can run,
// yet the embed phase that finishes assembling it runs later — an unbreakable
// cycle, and the build fails with:
//   "Cycle inside <app>; building could produce unreliable results."
//
// The embed phase only depends on the extension target's product (an implicit
// target dependency), so it is safe to run earlier. Moving it to just after the
// host target's Resources phase makes the dependency one-directional and resolves
// the cycle. No-op if the phase is already positioned before the run scripts.
//───────────────────────────────────────────────────────────────────────────
function moveEmbedAppExtensionsPhaseBeforeScripts(pbx: any): void {
  const objects = pbx.hash.project.objects;
  const nativeTargets = objects.PBXNativeTarget || {};
  const copyPhases = objects.PBXCopyFilesBuildPhase || {};
  const resourcePhases = objects.PBXResourcesBuildPhase || {};

  for (const key of Object.keys(nativeTargets)) {
    if (key.endsWith("_comment")) continue;
    const target = nativeTargets[key];
    if (
      !target ||
      typeof target !== "object" ||
      !String(target.productType || "").includes("product-type.application")
    ) {
      continue;
    }

    const phases = target.buildPhases || [];
    // "Embed App Extensions" is a copy-files phase whose destination is PlugIns
    // (dstSubfolderSpec 13).
    const embedIndex = phases.findIndex((bp: any) => {
      const phase = copyPhases[bp.value];
      return phase && String(phase.dstSubfolderSpec) === "13";
    });
    const resourceIndex = phases.findIndex(
      (bp: any) => resourcePhases[bp.value],
    );
    if (embedIndex < 0 || resourceIndex < 0) continue;
    if (embedIndex === resourceIndex + 1) continue; // already early enough

    const [embed] = phases.splice(embedIndex, 1);
    // embedIndex > resourceIndex, so resourceIndex is unaffected by the splice.
    phases.splice(resourceIndex + 1, 0, embed);
  }
}

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

    // Write extension files first
    await writeShareExtensionFiles(
      platformProjectRoot,
      scheme,
      appIdentifier,
      parameters,
      config.name,
    );

    const pbxProject = config.modResults;

    /* ------------------------------------------------------------------ */
    /* 1. Bail out early if target/group already exist                    */
    /* ------------------------------------------------------------------ */
    const existingTarget = pbxProject.pbxTargetByName(extensionName);
    if (existingTarget) {
      console.log(
        `[expo-share-intent] ${extensionName} already exists in project. Skipping…`,
      );
      return config;
    }

    const existingGroups = pbxProject.hash.project.objects.PBXGroup;
    const groupExists = Object.values(existingGroups).some(
      (group: any) => group && group.name === extensionName,
    );
    if (groupExists) {
      console.log(
        `[expo-share-intent] ${extensionName} group already exists in project. Skipping…`,
      );
      return config;
    }

    /* ------------------------------------------------------------------ */
    /* 2. Resolve DEVELOPMENT_TEAM                                        */
    /* ------------------------------------------------------------------ */
    const detectedDevTeam = getMainAppDevelopmentTeam(pbxProject);
    const devTeam = detectedDevTeam ?? undefined;

    /* ------------------------------------------------------------------ */
    /* 3. Define all files for the extension                              */
    /* ------------------------------------------------------------------ */
    const sourceFiles = [shareExtensionViewControllerFileName];
    const resourceFiles = [
      shareExtensionStoryBoardFileName,
      shareExtensionPreprocessorFileName,
      "PrivacyInfo.xcprivacy",
    ];
    const configFiles = [
      shareExtensionInfoFileName,
      shareExtensionEntitlementsFileName,
    ];
    const allFiles = [...sourceFiles, ...resourceFiles, ...configFiles];

    /* ------------------------------------------------------------------ */
    /* 4. Create target, group & build phases (CORRECTED APPROACH)       */
    /* ------------------------------------------------------------------ */

    // 4.1 Create PBXGroup for the extension using addPbxGroup (OneSignal style)
    const extGroup = pbxProject.addPbxGroup(
      allFiles,
      extensionName,
      extensionName,
    );

    // 4.2 Add the new PBXGroup to the top level group
    const groups = pbxProject.hash.project.objects.PBXGroup;
    Object.keys(groups).forEach(function (key) {
      if (
        typeof groups[key] === "object" &&
        groups[key].name === undefined &&
        groups[key].path === undefined
      ) {
        pbxProject.addToPbxGroup(extGroup.uuid, key);
      }
    });

    // 4.3 WORK AROUND for addTarget BUG (from OneSignal)
    // Xcode projects don't contain these if there is only one target
    const projObjects = pbxProject.hash.project.objects;
    projObjects.PBXTargetDependency = projObjects.PBXTargetDependency || {};
    projObjects.PBXContainerItemProxy = projObjects.PBXContainerItemProxy || {};

    // 4.4 Create native target
    const target = pbxProject.addTarget(
      extensionName,
      "app_extension",
      extensionName,
    );

    // 4.5 Add build phases to the new target
    pbxProject.addBuildPhase(
      sourceFiles, // Add source files directly to the build phase
      "PBXSourcesBuildPhase",
      "Sources",
      target.uuid,
    );

    pbxProject.addBuildPhase(
      resourceFiles, // Add resource files directly to the build phase
      "PBXResourcesBuildPhase",
      "Resources",
      target.uuid,
    );

    pbxProject.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      target.uuid,
    );

    /* ------------------------------------------------------------------ */
    /* 5. Build-settings configuration                                    */
    /* ------------------------------------------------------------------ */
    const configurations = pbxProject.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const config = configurations[key];
      const buildSettingsObj = config.buildSettings;
      if (!buildSettingsObj) continue;

      if (
        typeof buildSettingsObj["PRODUCT_NAME"] !== "undefined" &&
        buildSettingsObj["PRODUCT_NAME"] === `"${extensionName}"`
      ) {
        buildSettingsObj["CLANG_ENABLE_MODULES"] = "YES";
        buildSettingsObj["INFOPLIST_FILE"] =
          `"${extensionName}/${shareExtensionInfoFileName}"`;
        buildSettingsObj["CODE_SIGN_ENTITLEMENTS"] =
          `"${extensionName}/${shareExtensionEntitlementsFileName}"`;
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

        if (devTeam) {
          buildSettingsObj["DEVELOPMENT_TEAM"] = devTeam;
        }
      }
    }

    /* ------------------------------------------------------------------ */
    /* 6. Apply DevelopmentTeam to both targets                           */
    /* ------------------------------------------------------------------ */
    if (devTeam) {
      pbxProject.addTargetAttribute("DevelopmentTeam", devTeam);
      const shareTarget = pbxProject.pbxTargetByName(extensionName);
      pbxProject.addTargetAttribute("DevelopmentTeam", devTeam, shareTarget);
    }

    /* ------------------------------------------------------------------ */
    /* 7. Avoid the "Embed App Extensions" ↔ run-script build cycle       */
    /* ------------------------------------------------------------------ */
    moveEmbedAppExtensionsPhaseBeforeScripts(pbxProject);

    console.log(
      `[expo-share-intent] Successfully created ${extensionName} target with files`,
    );

    return config;
  });
};
