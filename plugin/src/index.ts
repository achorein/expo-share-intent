import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "@expo/config-plugins";

// Android
import { withAndroidIntentFilters } from "./android/withAndroidIntentFilters";
import { withAndroidMainActivityAttributes } from "./android/withAndroidMainActivityAttributes";
// iOS
import { withAppEntitlements } from "./ios/withIosAppEntitlements";
import { withShareExtensionConfig } from "./ios/withIosShareExtensionConfig";
import { withShareExtensionXcodeTarget } from "./ios/withIosShareExtensionXcodeTarget";
import { Parameters } from "./types";

const pkg: { name: string; version?: string } = {
  name: "expo-share-intent",
  version: "UNVERSIONED",
};

const withShareMenu: ConfigPlugin<Parameters> = createRunOncePlugin(
  (config, params = {}) => {
    return withPlugins(config, [
      // IOS
      withAppEntitlements,
      withShareExtensionConfig,
      () => withShareExtensionXcodeTarget(config, params),
      // Android
      () => withAndroidIntentFilters(config, params),
      () => withAndroidMainActivityAttributes(config, params),
    ]);
  },
  pkg.name,
  pkg.version,
);

export default withShareMenu;
