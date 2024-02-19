import path from "node:path";
import fs from "node:fs";
import plist from "@expo/plist";

import { Parameters } from "../types";

import {
  shareExtensionName,
  getAppGroups,
  shareExtensionEntitlementsFileName,
  shareExtensionInfoFileName,
  shareExtensionStoryBoardFileName,
  shareExtensionViewControllerFileName,
} from "./constants";

export async function writeShareExtensionFiles(
  platformProjectRoot: string,
  scheme: string,
  appIdentifier: string,
  parameters: Parameters
) {
  const infoPlistFilePath = getShareExtensionInfoFilePath(platformProjectRoot);
  const infoPlistContent = getShareExtensionInfoContent(
    parameters.iosActivationRules
  );
  await fs.promises.mkdir(path.dirname(infoPlistFilePath), { recursive: true });
  await fs.promises.writeFile(infoPlistFilePath, infoPlistContent);

  const entitlementsFilePath =
    getShareExtensionEntitlementsFilePath(platformProjectRoot);
  const entitlementsContent =
    getShareExtensionEntitlementsContent(appIdentifier);
  await fs.promises.writeFile(entitlementsFilePath, entitlementsContent);

  const storyboardFilePath =
    getShareExtensionStoryboardFilePath(platformProjectRoot);
  const storyboardContent = getShareExtensionStoryBoardContent();
  await fs.promises.writeFile(storyboardFilePath, storyboardContent);

  const viewControllerFilePath =
    getShareExtensionViewControllerPath(platformProjectRoot);
  const viewControllerContent = getShareExtensionViewControllerContent(
    scheme,
    appIdentifier
  );
  await fs.promises.writeFile(viewControllerFilePath, viewControllerContent);
}

//: [root]/ios/ShareExtension/ShareExtension-Entitlements.plist
export function getShareExtensionEntitlementsFilePath(
  platformProjectRoot: string
) {
  return path.join(
    platformProjectRoot,
    shareExtensionName,
    shareExtensionEntitlementsFileName
  );
}

export function getShareExtensionEntitlements(appIdentifier: string) {
  return {
    "com.apple.security.application-groups": getAppGroups(appIdentifier),
  };
}

export function getShareExtensionEntitlementsContent(appIdentifier: string) {
  return plist.build(getShareExtensionEntitlements(appIdentifier));
}

//: [root]/ios/ShareExtension/ShareExtension-Info.plist
export function getShareExtensionInfoFilePath(platformProjectRoot: string) {
  return path.join(
    platformProjectRoot,
    shareExtensionName,
    shareExtensionInfoFileName
  );
}

export function getShareExtensionInfoContent(
  activationRules: Parameters["iosActivationRules"]
) {
  return plist.build({
    CFBundleName: "$(PRODUCT_NAME)",
    CFBundleDisplayName: "$(PRODUCT_NAME) Share Extension",
    CFBundleIdentifier: "$(PRODUCT_BUNDLE_IDENTIFIER)",
    CFBundleDevelopmentRegion: "$(DEVELOPMENT_LANGUAGE)",
    CFBundleExecutable: "$(EXECUTABLE_NAME)",
    CFBundleInfoDictionaryVersion: "6.0",
    CFBundlePackageType: "$(PRODUCT_BUNDLE_PACKAGE_TYPE)",
    NSExtension: {
      NSExtensionAttributes: {
        NSExtensionActivationRule: activationRules || {
          NSExtensionActivationSupportsWebURLWithMaxCount: 1,
          NSExtensionActivationSupportsWebPageWithMaxCount: 1,
        },
      },
      NSExtensionMainStoryboard: "MainInterface",
      NSExtensionPointIdentifier: "com.apple.share-services",
    },
  });
}

//: [root]/ios/ShareExtension/ShareExtension-Info.plist
export function getShareExtensionStoryboardFilePath(
  platformProjectRoot: string
) {
  return path.join(
    platformProjectRoot,
    shareExtensionName,
    shareExtensionStoryBoardFileName
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
  platformProjectRoot: string
) {
  return path.join(
    platformProjectRoot,
    shareExtensionName,
    shareExtensionViewControllerFileName
  );
}

export function getShareExtensionViewControllerContent(
  scheme: string,
  appIdentifier: string
) {
  console.debug(
    `[expo-share-intent] add ios share extension (scheme:${scheme} appIdentifier:${appIdentifier})`
  );

  const content = fs.readFileSync(
    path.resolve(__dirname, "./ShareExtensionViewController.swift"),
    "utf8"
  );

  return content
    .replaceAll("<SCHEME>", scheme)
    .replaceAll("<APPIDENTIFIER>", appIdentifier);
}
