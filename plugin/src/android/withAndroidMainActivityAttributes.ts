/*!
 * Plugin created for Expo Share Intent (https://github.com/achorein/expo-share-intent)
 * author: achorein (https://github.com/achorein)
 *
 * inspired by: https://forums.expo.dev/t/how-to-edit-android-manifest-was-build/65663/4
 */
import {
  AndroidManifest,
  ConfigPlugin,
  withAndroidManifest,
} from "@expo/config-plugins";

import { Parameters } from "../types";

function addAttributesToMainActivity(
  androidManifest: AndroidManifest,
  attributes: Parameters["androidMainActivityAttributes"],
) {
  const { manifest } = androidManifest;

  if (!Array.isArray(manifest["application"])) {
    console.warn(
      "withAndroidMainActivityAttributes: No application array in manifest?",
    );
    return androidManifest;
  }

  const application = manifest["application"].find(
    (item) => item.$["android:name"] === ".MainApplication",
  );
  if (!application) {
    console.warn("withAndroidMainActivityAttributes: No .MainApplication?");
    return androidManifest;
  }

  if (!Array.isArray(application["activity"])) {
    console.warn(
      "withAndroidMainActivityAttributes: No activity array in .MainApplication?",
    );
    return androidManifest;
  }

  const activity = application["activity"].find(
    (item) => item.$["android:name"] === ".MainActivity",
  );
  if (!activity) {
    console.warn("withAndroidMainActivityAttributes: No .MainActivity?");
    return androidManifest;
  }

  const newAttributes = attributes || {
    "android:launchMode": "singleTask",
  };

  activity.$ = { ...activity.$, ...newAttributes };

  return androidManifest;
}

export const withAndroidMainActivityAttributes: ConfigPlugin<Parameters> = (
  config,
  parameters,
) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = addAttributesToMainActivity(
      config.modResults,
      parameters?.androidMainActivityAttributes,
    );
    return config;
  });
};
