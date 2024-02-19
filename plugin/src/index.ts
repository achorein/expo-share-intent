import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "@expo/config-plugins";

import { Parameters } from "./types";

// Android
import { withAndroidIntentFilters } from "./android/withAndroidIntentFilters";

// iOS
import { withAppEntitlements } from "./ios/withIosAppEntitlements";
import { withShareExtensionConfig } from "./ios/withIosShareExtensionConfig";
import { withShareExtensionXcodeTarget } from "./ios/withIosShareExtensionXcodeTarget";

let pkg: { name: string; version?: string } = {
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
    ]);
  },
  pkg.name,
  pkg.version
);

export default withShareMenu;
