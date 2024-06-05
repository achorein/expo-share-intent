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
    let updatedScheme = Constants.expoConfig?.scheme;
    if (Array.isArray(Constants.expoConfig?.scheme)) {
      updatedScheme = updatedScheme[0];
      options?.debug &&
        console.debug(
          `expoShareIntent[scheme] from expoConfig: multiple scheme detected (${Constants.expoConfig?.scheme.join(",")}), using:${updatedScheme}`,
        );
    } else {
      options?.debug &&
        console.debug(
          "expoShareIntent[scheme] from expoConfig:",
          updatedScheme,
        );
    }
    return updatedScheme;
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
