import Constants from "expo-constants";
import { createURL } from "expo-linking";

import { ShareIntentOptions } from "./ExpoShareIntentModule.types";

export const getScheme = (options?: ShareIntentOptions) => {
  if (options?.scheme !== undefined) {
    options?.debug &&
      console.debug("expoShareIntent[scheme] from option:", options.scheme);
    return options.scheme;
  }
  if (Constants.expoConfig?.scheme) {
    options?.debug &&
      console.debug(
        "expoShareIntent[scheme] from expoConfig:",
        Constants.expoConfig?.scheme,
      );
    return Constants.expoConfig?.scheme;
  }
  const deepLinkUrl = createURL("dataUrl=");
  const extracted = deepLinkUrl.match(/^([^:]+)/gi)?.[0] || null;
  options?.debug &&
    console.debug(
      "expoShareIntent[scheme] from linking url:",
      deepLinkUrl,
      extracted,
    );
  return extracted;
};

export const getShareExtensionKey = (options?: ShareIntentOptions) => {
  const scheme = getScheme(options);
  return `${scheme}ShareKey`;
};
