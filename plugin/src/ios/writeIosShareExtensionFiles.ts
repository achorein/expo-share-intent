import plist from "@expo/plist";
import { ConfigPlugin } from "@expo/config-plugins";
import fs from "node:fs";
import path from "node:path";

import {
  getShareExtensionName,
  getAppGroup,
  shareExtensionEntitlementsFileName,
  shareExtensionInfoFileName,
  shareExtensionStoryBoardFileName,
  shareExtensionViewControllerFileName,
} from "./constants";
import { Parameters } from "../types";

export async function writeShareExtensionFiles(
  platformProjectRoot: string,
  scheme: string,
  appIdentifier: string,
  parameters: Parameters,
  appName: ConfigPlugin<Parameters>["name"],
) {
  // ShareExtension-Info.plist
  const infoPlistFilePath = getShareExtensionInfoFilePath(
    platformProjectRoot,
    parameters,
  );
  const infoPlistContent = getShareExtensionInfoContent(
    appName,
    appIdentifier,
    parameters,
  );
  await fs.promises.mkdir(path.dirname(infoPlistFilePath), { recursive: true });
  await fs.promises.writeFile(infoPlistFilePath, infoPlistContent);

  // ShareExtension.entitlements
  const entitlementsFilePath = getShareExtensionEntitlementsFilePath(
    platformProjectRoot,
    parameters,
  );
  const entitlementsContent = getShareExtensionEntitlementsContent(
    appIdentifier,
    parameters,
  );
  await fs.promises.writeFile(entitlementsFilePath, entitlementsContent);

  // PrivacyInfo.xcprivacy
  const pricayFilePath = getPrivacyInfoFilePath(
    platformProjectRoot,
    parameters,
  );
  const pricayContent = getPrivacyInfoContent();
  await fs.promises.writeFile(pricayFilePath, pricayContent);

  // MainInterface.storyboard
  const storyboardFilePath = getShareExtensionStoryboardFilePath(
    platformProjectRoot,
    parameters,
  );
  const storyboardContent = getShareExtensionStoryBoardContent();
  await fs.promises.writeFile(storyboardFilePath, storyboardContent);

  // ShareViewController.swift
  const viewControllerFilePath = getShareExtensionViewControllerPath(
    platformProjectRoot,
    parameters,
  );
  const viewControllerContent = getShareExtensionViewControllerContent(
    scheme,
    getAppGroup(appIdentifier, parameters),
  );
  await fs.promises.writeFile(viewControllerFilePath, viewControllerContent);
}

//: [root]/ios/ShareExtension/ShareExtension.entitlements
export function getShareExtensionEntitlementsFilePath(
  platformProjectRoot: string,
  parameters: Parameters,
) {
  return path.join(
    platformProjectRoot,
    getShareExtensionName(parameters),
    shareExtensionEntitlementsFileName,
  );
}

export function getShareExtensionEntitlements(
  appIdentifier: string,
  parameters: Parameters,
) {
  return {
    "com.apple.security.application-groups": [
      getAppGroup(appIdentifier, parameters),
    ],
  };
}

export function getShareExtensionEntitlementsContent(
  appIdentifier: string,
  parameters: Parameters,
) {
  return plist.build(getShareExtensionEntitlements(appIdentifier, parameters));
}

//: [root]/ios/ShareExtension/ShareExtension-Info.plist
export function getShareExtensionInfoFilePath(
  platformProjectRoot: string,
  parameters: Parameters,
) {
  return path.join(
    platformProjectRoot,
    getShareExtensionName(parameters),
    shareExtensionInfoFileName,
  );
}

export function getShareExtensionInfoContent(
  appName: ConfigPlugin<Parameters>["name"],
  appIdentifier: string,
  parameters: Parameters,
) {
  return plist.build({
    CFBundleName: "$(PRODUCT_NAME)",
    CFBundleDisplayName:
      parameters.iosShareExtensionName || `${appName} - Share Extension`,
    CFBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)",
    CFBundleDevelopmentRegion: "$(DEVELOPMENT_LANGUAGE)",
    CFBundleExecutable: "$(EXECUTABLE_NAME)",
    CFBundleInfoDictionaryVersion: "6.0",
    CFBundlePackageType: "$(PRODUCT_BUNDLE_PACKAGE_TYPE)",
    NSExtension: {
      NSExtensionAttributes: {
        NSExtensionActivationRule: parameters.iosActivationRules || {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsWebPageWithMaxCount: 1,
        },
      },
      NSExtensionMainStoryboard: "MainInterface",
      NSExtensionPointIdentifier: "com.apple.share-services",
    },
    // use in ExpoShareIntentModule.swift
    AppGroupIdentifier: getAppGroup(appIdentifier, parameters),
  });
}

//: [root]/ios/ShareExtension/PrivacyInfo.xcprivacy
export function getPrivacyInfoFilePath(
  platformProjectRoot: string,
  parameters: Parameters,
) {
  return path.join(
    platformProjectRoot,
    getShareExtensionName(parameters),
    "PrivacyInfo.xcprivacy",
  );
}

export function getPrivacyInfoContent() {
  return plist.build({
    NSPrivacyAccessedAPITypes: [
      {
        NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
        NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
      },
    ],
    NSPrivacyCollectedDataTypes: [],
    NSPrivacyTracking: false,
  });
}

//: [root]/ios/ShareExtension/MainInterface.storyboard
export function getShareExtensionStoryboardFilePath(
  platformProjectRoot: string,
  parameters: Parameters,
) {
  return path.join(
    platformProjectRoot,
    getShareExtensionName(parameters),
    shareExtensionStoryBoardFileName,
  );
}

export function getShareExtensionStoryBoardContent() {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <document type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB" version="3.0" toolsVersion="13122.16" targetRuntime="iOS.CocoaTouch" propertyAccessControl="none" useAutolayout="YES" useTraitCollections="YES" useSafeAreas="YES" colorMatched="YES" initialViewController="j1y-V4-xli">
      <dependencies>
          <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="13104.12"/>
          <capability name="Safe area layout guides" minToolsVersion="9.0"/>
          <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
      </dependencies>
      <scenes>
          <!--Share View Controller-->
          <scene sceneID="ceB-am-kn3">
              <objects>
                  <viewController id="j1y-V4-xli" customClass="ShareViewController" customModuleProvider="target" sceneMemberID="viewController">
                      <view key="view" opaque="NO" contentMode="scaleToFill" id="wbc-yd-nQP">
                          <rect key="frame" x="0.0" y="0.0" width="375" height="667"/>
                          <autoresizingMask key="autoresizingMask" widthSizable="YES" heightSizable="YES"/>
                          <color key="backgroundColor" red="0.0" green="0.0" blue="0.0" alpha="0.0" colorSpace="custom" customColorSpace="sRGB"/>
                          <viewLayoutGuide key="safeArea" id="1Xd-am-t49"/>
                      </view>
                  </viewController>
                  <placeholder placeholderIdentifier="IBFirstResponder" id="CEy-Cv-SGf" userLabel="First Responder" sceneMemberID="firstResponder"/>
              </objects>
          </scene>
      </scenes>
  </document>
  `;
}

//: [root]/ios/ShareExtension/ShareViewController.swift
export function getShareExtensionViewControllerPath(
  platformProjectRoot: string,
  parameters: Parameters,
) {
  return path.join(
    platformProjectRoot,
    getShareExtensionName(parameters),
    shareExtensionViewControllerFileName,
  );
}

export function getShareExtensionViewControllerContent(
  scheme: string,
  groupIdentifier: string,
) {
  let updatedScheme = scheme;
  if (Array.isArray(scheme)) {
    console.debug(
      `[expo-share-intent] multiple scheme detected (${scheme.join(",")}), using:${updatedScheme}`,
    );
    updatedScheme = scheme[0];
  }
  console.debug(
    `[expo-share-intent] add ios share extension (scheme:${updatedScheme} groupIdentifier:${groupIdentifier})`,
  );
  if (!updatedScheme) {
    throw new Error(
      "[expo-share-intent] missing custom URL scheme 'expo.scheme' in app.json ! (see https://docs.expo.dev/guides/linking/#linking-to-your-app)",
    );
  }

  const content = fs.readFileSync(
    path.resolve(__dirname, "./ShareExtensionViewController.swift"),
    "utf8",
  );

  return content
    .replaceAll("<SCHEME>", updatedScheme)
    .replaceAll("<GROUPIDENTIFIER>", groupIdentifier);
}
